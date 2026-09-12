import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

import { apiKey, baseUrl, model } from '../config/env.js';
import { callChatCompletion } from '../infrastructure/llm/chatClient.js';
import { executeToolCall, toolDefinitions } from '../capabilities/tools/index.js';

const messages = [
    {
        role: 'system',
        content: '你是一个最小 agent。你可以使用工具查看当前工作区的目录、文件和文本搜索结果。先思考是否需要工具；需要时调用工具，不需要时直接回答。'
    }
];

export async function runAgent() {
    console.log('最小 agent 已启动，输入 exit 退出。');
    console.log(`模型：${model}`);

    const rl = readline.createInterface({ input, output });

    while (true) {
        const userInput = (await rl.question('\n你：')).trim();
        if (!userInput) continue;
        if (userInput.toLowerCase() === 'exit') break;

        messages.push({ role: 'user', content: userInput });

        while (true) {
            const result = await callChatCompletion({
                baseUrl,
                apiKey,
                model,
                messages,
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

            messages.push({
                role: 'assistant',
                content: assistantMessage.content || '',
                tool_calls: assistantMessage.tool_calls
            });

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

                messages.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: toolResult
                });
            }
        }
    }

    rl.close();
}
