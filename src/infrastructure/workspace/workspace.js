import fs from 'node:fs';
import path from 'node:path';

export const workspaceRoot = process.cwd();

export function resolveWorkspacePath(targetPath = '.') {
    const resolvedPath = path.resolve(workspaceRoot, targetPath);
    const workspaceRootWithSeparator = workspaceRoot.endsWith(path.sep)
        ? workspaceRoot
        : `${workspaceRoot}${path.sep}`;

    if (resolvedPath !== workspaceRoot && !resolvedPath.startsWith(workspaceRootWithSeparator)) {
        throw new Error(`路径超出工作区范围：${targetPath}`);
    }

    return resolvedPath;
}

export function readTextFile(targetPath, { offset = 1, limit = 200 } = {}) {
    const absolutePath = resolveWorkspacePath(targetPath);
    const stat = fs.statSync(absolutePath);

    if (!stat.isFile()) {
        throw new Error(`不是文件：${targetPath}`);
    }

    const content = fs.readFileSync(absolutePath, 'utf8');
    const lines = content.split(/\r?\n/);
    const startIndex = Math.max(0, offset - 1);
    const endIndex = limit ? Math.min(lines.length, startIndex + limit) : lines.length;

    return {
        path: path.relative(workspaceRoot, absolutePath) || '.',
        totalLines: lines.length,
        offset,
        limit,
        content: lines.slice(startIndex, endIndex).join('\n')
    };
}

export function listDirectory(targetPath = '.') {
    const absolutePath = resolveWorkspacePath(targetPath);
    const stat = fs.statSync(absolutePath);

    if (!stat.isDirectory()) {
        throw new Error(`不是目录：${targetPath}`);
    }

    const entries = fs.readdirSync(absolutePath, { withFileTypes: true }).map((entry) => ({
        name: entry.name,
        type: entry.isDirectory() ? 'directory' : entry.isSymbolicLink() ? 'symlink' : 'file'
    }));

    return {
        path: path.relative(workspaceRoot, absolutePath) || '.',
        entries
    };
}

function shouldSkipDirectory(directoryName) {
    return directoryName === 'node_modules' || directoryName === '.git' || directoryName === '.vscode';
}

function isProbablyTextFile(filePath) {
    const extension = path.extname(filePath).toLowerCase();
    return [
        '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.json', '.md', '.txt', '.yml', '.yaml', '.env', '.css', '.html'
    ].includes(extension) || extension === '';
}

function walkFiles(startPath, files = []) {
    for (const entry of fs.readdirSync(startPath, { withFileTypes: true })) {
        const entryPath = path.join(startPath, entry.name);

        if (entry.isDirectory()) {
            if (!shouldSkipDirectory(entry.name)) {
                walkFiles(entryPath, files);
            }
            continue;
        }

        if (entry.isFile() && isProbablyTextFile(entryPath)) {
            files.push(entryPath);
        }
    }

    return files;
}

export function searchTextInWorkspace({ query, targetPath = '.', maxResults = 20, caseSensitive = false }) {
    if (!query) {
        throw new Error('缺少 query 参数');
    }

    const absoluteStartPath = resolveWorkspacePath(targetPath);
    const searchRootStat = fs.statSync(absoluteStartPath);
    const filesToSearch = searchRootStat.isDirectory() ? walkFiles(absoluteStartPath) : [absoluteStartPath];
    const normalizedQuery = caseSensitive ? query : query.toLowerCase();
    const matches = [];

    for (const filePath of filesToSearch) {
        if (matches.length >= maxResults) break;

        let content = '';
        try {
            content = fs.readFileSync(filePath, 'utf8');
        } catch {
            continue;
        }

        const lines = content.split(/\r?\n/);
        for (let lineNumber = 0; lineNumber < lines.length; lineNumber += 1) {
            const line = lines[lineNumber];
            const haystack = caseSensitive ? line : line.toLowerCase();

            if (haystack.includes(normalizedQuery)) {
                matches.push({
                    file: path.relative(workspaceRoot, filePath) || '.',
                    line: lineNumber + 1,
                    text: line.trim()
                });

                if (matches.length >= maxResults) break;
            }
        }
    }

    return {
        query,
        path: path.relative(workspaceRoot, absoluteStartPath) || '.',
        count: matches.length,
        matches
    };
}
