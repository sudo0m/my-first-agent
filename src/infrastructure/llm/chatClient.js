import { parseJsonLoose } from '../../shared/json.js';

export async function callChatCompletion({ baseUrl, apiKey, model, messages, tools }) {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model,
            messages,
            tools,
            tool_choice: 'auto',
            temperature: 0.2
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`模型请求失败：${response.status} ${response.statusText}\n${errorText}`);
    }

    const responseText = await response.text();
    return parseJsonLoose(responseText);
}
