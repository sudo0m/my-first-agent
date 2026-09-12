export function createConversation({ systemPrompt }) {
    return {
        messages: systemPrompt ? [{ role: 'system', content: systemPrompt }] : []
    };
}

export function addUserMessage(conversation, content) {
    conversation.messages.push({ role: 'user', content });
}

export function addAssistantMessage(conversation, message) {
    conversation.messages.push({
        role: 'assistant',
        content: message.content || '',
        tool_calls: message.tool_calls
    });
}

export function addToolMessage(conversation, { toolCallId, content }) {
    conversation.messages.push({
        role: 'tool',
        tool_call_id: toolCallId,
        content
    });
}
