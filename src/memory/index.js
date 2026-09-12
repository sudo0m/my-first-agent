import fs from 'node:fs';
import path from 'node:path';

const agentDirectory = path.join(process.cwd(), '.agent');
const memoryFilePath = path.join(agentDirectory, 'memory.json');

function ensureMemoryFile() {
    if (!fs.existsSync(agentDirectory)) {
        fs.mkdirSync(agentDirectory, { recursive: true });
    }

    if (!fs.existsSync(memoryFilePath)) {
        fs.writeFileSync(memoryFilePath, JSON.stringify({ items: [] }, null, 2), 'utf8');
    }
}

function loadState() {
    ensureMemoryFile();

    try {
        const rawContent = fs.readFileSync(memoryFilePath, 'utf8');
        const parsed = JSON.parse(rawContent);
        if (!parsed || !Array.isArray(parsed.items)) {
            return { items: [] };
        }

        return parsed;
    } catch {
        return { items: [] };
    }
}

function saveState(state) {
    ensureMemoryFile();
    fs.writeFileSync(memoryFilePath, JSON.stringify(state, null, 2), 'utf8');
}

function formatEntry(entry) {
    const content = String(entry.content || '').trim().replace(/\s+/g, ' ');
    const clippedContent = content.length > 120 ? `${content.slice(0, 117)}...` : content;
    return `${entry.role}: ${clippedContent}`;
}

export function createMemoryStore() {
    const state = loadState();

    return {
        add(entry) {
            state.items.push({
                ...entry,
                at: entry.at || new Date().toISOString()
            });
            saveState(state);
        },
        getAll() {
            return [...state.items];
        },
        getRecent(limit = 8) {
            return state.items.slice(-limit);
        },
        buildContextMessage(limit = 8) {
            const recentItems = state.items.slice(-limit);
            if (recentItems.length === 0) {
                return null;
            }

            return {
                role: 'system',
                content: `最近记忆：\n${recentItems.map(formatEntry).join('\n')}`
            };
        },
        clear() {
            state.items = [];
            saveState(state);
        }
    };
}
