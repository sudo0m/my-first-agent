import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const filesToCheck = [
    'index.js',
    'src/cli/index.js',
    'src/application/agentRunner.js',
    'src/config/env.js',
    'src/domain/conversation.js',
    'src/domain/plan.js',
    'src/domain/index.js',
    'src/shared/json.js',
    'src/infrastructure/llm/chatClient.js',
    'src/infrastructure/workspace/workspace.js',
    'src/memory/index.js',
    'src/planner/index.js',
    'src/capabilities/tools/index.js',
    'src/capabilities/tools/clock.js',
    'src/capabilities/tools/fs/listDir.js',
    'src/capabilities/tools/fs/readFile.js',
    'src/capabilities/tools/fs/searchText.js'
];

for (const relativeFilePath of filesToCheck) {
    const absoluteFilePath = path.join(projectRoot, relativeFilePath);
    execFileSync(process.execPath, ['--check', absoluteFilePath], { stdio: 'inherit' });
}

console.log('所有文件语法检查通过。');
