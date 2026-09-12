import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const child = spawn(process.execPath, ['index.js'], {
    cwd: projectRoot,
    stdio: ['pipe', 'pipe', 'inherit']
});

let output = '';
let exited = false;

child.stdout.setEncoding('utf8');
child.stdout.on('data', (chunk) => {
    output += chunk;
    process.stdout.write(chunk);

    if (!exited && output.includes('最小 agent 已启动')) {
        exited = true;
        child.stdin.write('exit\n');
        child.stdin.end();
    }
});

child.on('close', (code) => {
    if (code !== 0) {
        process.exitCode = code ?? 1;
        return;
    }

    if (!output.includes('最小 agent 已启动')) {
        console.error('Smoke 测试失败：没有看到启动提示。');
        process.exitCode = 1;
        return;
    }

    console.log('Smoke 测试通过。');
});
