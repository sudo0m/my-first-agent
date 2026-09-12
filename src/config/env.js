import fs from 'node:fs';
import path from 'node:path';

function loadEnv(filePath = path.join(process.cwd(), '.env')) {
    if (!fs.existsSync(filePath)) return {};

    const content = fs.readFileSync(filePath, 'utf8');
    const env = {};

    for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;

        const equalsIndex = line.indexOf('=');
        if (equalsIndex === -1) continue;

        const key = line.slice(0, equalsIndex).trim();
        let value = line.slice(equalsIndex + 1).trim();

        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }

        env[key] = value;
    }

    return env;
}

const env = { ...loadEnv(), ...process.env };

export const baseUrl = env.BASE_URL || 'http://localhost:20128/v1';
export const apiKey = env.BASE_KEY || 'sk-local-demo';
export const model = env.MODEL || 'my-combo';
