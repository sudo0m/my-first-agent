function extractFirstJsonValue(text) {
    const trimmed = text.trim();
    if (!trimmed) {
        throw new Error('空响应');
    }

    const startIndex = trimmed.search(/[\[{]/);
    if (startIndex === -1) {
        throw new Error(`响应中没有找到 JSON：${trimmed.slice(0, 120)}`);
    }

    const opening = trimmed[startIndex];
    const closing = opening === '{' ? '}' : ']';
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = startIndex; index < trimmed.length; index += 1) {
        const character = trimmed[index];

        if (inString) {
            if (escaped) {
                escaped = false;
            } else if (character === '\\') {
                escaped = true;
            } else if (character === '"') {
                inString = false;
            }
            continue;
        }

        if (character === '"') {
            inString = true;
            continue;
        }

        if (character === opening) {
            depth += 1;
        } else if (character === closing) {
            depth -= 1;

            if (depth === 0) {
                const jsonText = trimmed.slice(startIndex, index + 1);
                return JSON.parse(jsonText);
            }
        }
    }

    throw new Error('JSON 没有正确闭合');
}

export function parseJsonLoose(text) {
    try {
        return JSON.parse(text);
    } catch {
        return extractFirstJsonValue(text);
    }
}
