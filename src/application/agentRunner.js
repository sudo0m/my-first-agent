import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

import { addAssistantMessage, addToolMessage, addUserMessage, createConversation, formatPlan } from '../domain/index.js';
import { apiKey, baseUrl, model } from '../config/env.js';
import { callChatCompletion } from '../infrastructure/llm/chatClient.js';
import { executeToolCall, toolDefinitions } from '../capabilities/tools/index.js';
import { createMemoryStore } from '../memory/index.js';
import { createPlanner } from '../planner/index.js';

const conversation = createConversation({
    systemPrompt: '你是一个最小 agent。你可以使用工具查看当前工作区的目录、文件和文本搜索结果。先思考是否需要工具；需要时调用工具，不需要时直接回答。'
});

const memoryStore = createMemoryStore();
const planner = createPlanner();

function buildRuntimeMessages(baseMessages, memoryContextMessage, planContextMessage) {
    const runtimeMessages = [...baseMessages];

    if (memoryContextMessage) {
        runtimeMessages.splice(1, 0, memoryContextMessage);
    }

    if (planContextMessage) {
        runtimeMessages.push(planContextMessage);
    }

    return runtimeMessages;
}

export async function runAgent() {
    console.log('最小 agent 已启动，输入 exit 退出。');
    console.log(`模型：${model}`);

    const rl = readline.createInterface({ input, output });

    while (true) {
        const userInput = (await rl.question('\n你：')).trim();
        if (!userInput) continue;
        if (userInput.toLowerCase() === 'exit') break;

        addUserMessage(conversation, userInput);
        memoryStore.add({ role: 'user', content: userInput });

        const plan = planner.shouldPlan(userInput) ? planner.createPlan(userInput) : null;
        const planContextMessage = plan
            ? {
                role: 'system',
                content: `本轮计划：\n${formatPlan(plan)}`
            }
            : null;

        if (plan) {
            console.log(`plan：\n${formatPlan(plan)}`);
        }

        const memoryContextMessage = memoryStore.buildContextMessage(8);

        while (true) {
            const result = await callChatCompletion({
                baseUrl,
                apiKey,
                model,
                messages: buildRuntimeMessages(conversation.messages, memoryContextMessage, planContextMessage),
                tools: toolDefinitions
            });
            const assistantMessage = result?.choices?.[0]?.message;

            if (!assistantMessage) {
                console.log('agent：没有收到模型回复');
                break;
            }

            if (assistantMessage.content) {
                console.log(`agent：${assistantMessage.content}`);
            }

            addAssistantMessage(conversation, assistantMessage);
            memoryStore.add({ role: 'assistant', content: assistantMessage.content || '' });

            if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
                break;
            }

            for (const toolCall of assistantMessage.tool_calls) {
                let toolResult = '';

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
            }
        }
    }

    rl.close();
}
