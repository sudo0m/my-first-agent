import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

import { addAssistantMessage, addToolMessage, addUserMessage, createConversation, createPlan, formatPlan } from '../domain/index.js';
import { apiKey, baseUrl, model, ssePort } from '../config/env.js';
import { callChatCompletion } from '../infrastructure/llm/chatClient.js';
import { executeToolCall, toolDefinitions } from '../capabilities/tools/index.js';
import { createMemoryStore } from '../memory/index.js';
import { createPlanner } from '../planner/index.js';
import { createSseServer } from '../stream/index.js';

const conversation = createConversation({
    systemPrompt: '你是一个最小 agent。你可以使用工具查看当前工作区的目录、文件和文本搜索结果。先思考是否需要工具；需要时调用工具，不需要时直接回答。'
});

const memoryStore = createMemoryStore();
const planner = createPlanner();
const streamServer = ssePort ? createSseServer({ port: ssePort }) : null;
const streamHub = streamServer?.hub || { publish() { } };

function buildRuntimeMessages(baseMessages, contextMessages = []) {
    const runtimeMessages = [...baseMessages];

    if (contextMessages.length > 0) {
        runtimeMessages.splice(1, 0, ...contextMessages);
    }

    return runtimeMessages;
}

function buildStepContextMessage(plan, step) {
    return {
        role: 'system',
        content: planner.buildStepPrompt(plan, step)
    }
}

async function executeStep({ step, plan, memoryContextMessages }) {
    planner.beginStep(plan, step.id);
    streamHub.publish({ type: 'step.start', data: { step } });

    while (true) {
        const result = await callChatCompletion({
            baseUrl,
            apiKey,
            model,
            messages: buildRuntimeMessages(conversation.messages, [...memoryContextMessages, buildStepContextMessage(plan, step)]),
            tools: toolDefinitions
        });
        const assistantMessage = result?.choices?.[0]?.message;

        if (!assistantMessage) {
            console.log('agent：没有收到模型回复');
            streamHub.publish({ type: 'error', data: { message: '没有收到模型回复' } });
            break;
        }

        if (assistantMessage.content) {
            console.log(`agent：${assistantMessage.content}`);
            streamHub.publish({ type: 'assistant.message', data: { content: assistantMessage.content } });
        }

        addAssistantMessage(conversation, assistantMessage);
        memoryStore.add({ role: 'assistant', content: assistantMessage.content || '' });

        if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
            break;
        }

        for (const toolCall of assistantMessage.tool_calls) {
            let toolResult = '';

            streamHub.publish({
                type: 'tool.call',
                data: {
                    toolName: toolCall.function?.name,
                    toolCallId: toolCall.id,
                    arguments: toolCall.function?.arguments || '{}'
                }
            });

            try {
                toolResult = executeToolCall(toolCall);
            } catch (error) {
                toolResult = `工具执行失败：${error.message}`;
            }

            addToolMessage(conversation, {
                toolCallId: toolCall.id,
                content: toolResult
            });

            memoryStore.add({ role: 'tool', content: toolResult });
            streamHub.publish({ type: 'tool.result', data: { toolCallId: toolCall.id, result: toolResult } });
        }
    }

    planner.finishStep(plan, step.id);
    streamHub.publish({ type: 'step.complete', data: { step } });
}

export async function runAgent() {
    console.log('最小 agent 已启动，输入 exit 退出。');
    console.log(`模型：${model}`);

    if (streamServer) {
        const { port } = await streamServer.start();
        console.log(`SSE 已启动：http://localhost:${port}/events`);
        streamHub.publish({ type: 'server.ready', data: { port } });
    }

    const rl = readline.createInterface({ input, output });

    while (true) {
        const userInput = (await rl.question('\n你：')).trim();
        if (!userInput) continue;
        if (userInput.toLowerCase() === 'exit') break;

        addUserMessage(conversation, userInput);
        memoryStore.add({ role: 'user', content: userInput });
        streamHub.publish({ type: 'user.message', data: { content: userInput } });

        const plan = planner.shouldPlan(userInput)
            ? planner.createPlan(userInput)
            : createPlan(userInput, ['理解用户问题并直接回答']);

        if (planner.shouldPlan(userInput)) {
            console.log(`plan：\n${formatPlan(plan)}`);
            streamHub.publish({ type: 'plan.created', data: { plan } });
        }

        const memoryContextMessages = memoryStore.buildContextMessages({ recentLimit: 8 });

        for (const step of plan.steps) {
            await executeStep({ step, plan, memoryContextMessages });
        }

        streamHub.publish({ type: 'plan.complete', data: { plan } });
    }

    rl.close();

    if (streamServer) {
        await streamServer.close();
    }
}
