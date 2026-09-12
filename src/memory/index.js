import fs from 'node:fs';
import path from 'node:path';

const agentDirectory = path.join(process.cwd(), '.agent');
const memoryFilePath = path.join(agentDirectory, 'memory.json');
const recentLimit = 12;
const longTermLimit = 80;
const summaryLimit = 1200;

function ensureMemoryFile() {
    if (!fs.existsSync(agentDirectory)) {
        fs.mkdirSync(agentDirectory, { recursive: true });
    }

    if (!fs.existsSync(memoryFilePath)) {
        fs.writeFileSync(memoryFilePath, JSON.stringify({ summary: '', recent: [], longTerm: [] }, null, 2), 'utf8');
    }
}

function loadState() {
    ensureMemoryFile();

    try {
        const rawContent = fs.readFileSync(memoryFilePath, 'utf8');
        const parsed = JSON.parse(rawContent);

        return {
            summary: typeof parsed.summary === 'string' ? parsed.summary : '',
            recent: Array.isArray(parsed.recent) ? parsed.recent : [],
            longTerm: Array.isArray(parsed.longTerm) ? parsed.longTerm : []
        };
    } catch {
        return { summary: '', recent: [], longTerm: [] };
    }
}

function saveState(state) {
    ensureMemoryFile();
    fs.writeFileSync(memoryFilePath, JSON.stringify(state, null, 2), 'utf8');
}

function normalizeText(value) {
    return String(value || '').trim().replace(/\s+/g, ' ');
}

function clipText(value, maxLength = 120) {
    const normalized = normalizeText(value);
    return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 3)}...` : normalized;
}

function formatEntry(entry) {
    const content = clipText(entry.content ?? entry.text ?? '', 120);
    const label = entry.role || entry.type || 'item';
    return `${label}: ${content}`;
}

function compactSummary(existingSummary, archivedEntries) {
    const archivedSummary = archivedEntries.map(formatEntry).join('\n');
    const merged = [existingSummary.trim(), archivedSummary].filter(Boolean).join('\n');
    return merged.slice(-summaryLimit);
}

function summarizeRecent(recentItems) {
    return recentItems.map(formatEntry).join('\n');
}

export function createMemoryStore() {
    const state = loadState();

    function compactIfNeeded() {
        while (state.recent.length > recentLimit) {
            const archivedEntry = state.recent.shift();
            state.longTerm.push({
                ...archivedEntry,
                archivedAt: new Date().toISOString()
            });
            state.summary = compactSummary(state.summary, [archivedEntry]);
        }

        while (state.longTerm.length > longTermLimit) {
            const archivedBatch = state.longTerm.splice(0, 8);
            state.summary = compactSummary(state.summary, archivedBatch);
        }
    }

    return {
        add(entry) {
            state.recent.push({
                ...entry,
                at: entry.at || new Date().toISOString()
            });
            compactIfNeeded();
            saveState(state);
        },
        getAll() {
            return {
                summary: state.summary,
                recent: [...state.recent],
                longTerm: [...state.longTerm]
            };
        },
        getRecent(limit = 8) {
            return state.recent.slice(-limit);
        },
        getSummary() {
            return state.summary;
        },
        buildContextMessages({ recentLimit: limit = 8, includeLongTerm = true } = {}) {
            const contextMessages = [];

            if (state.summary) {
                contextMessages.push({
                    role: 'system',
                    content: `长期摘要记忆：\n${state.summary}`
                });
            }

            if (includeLongTerm && state.longTerm.length > 0) {
                const longTermItems = state.longTerm.slice(-Math.min(5, state.longTerm.length));
                contextMessages.push({
                    role: 'system',
                    content: `长期记忆：\n${longTermItems.map(formatEntry).join('\n')}`
                });
            }

            const recentItems = state.recent.slice(-limit);
            if (recentItems.length > 0) {
                contextMessages.push({
                    role: 'system',
                    content: `近期记忆：\n${summarizeRecent(recentItems)}`
                });
            }

            return contextMessages;
        },
        clear() {
            state.summary = '';
            state.recent = [];
            state.longTerm = [];
            saveState(state);
        }
    };
}
