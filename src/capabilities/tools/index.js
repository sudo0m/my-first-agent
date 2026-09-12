import { definition as clockDefinition, execute as executeClock } from './clock.js';
import { definition as listDirDefinition, execute as executeListDir } from './fs/listDir.js';
import { definition as readFileDefinition, execute as executeReadFile } from './fs/readFile.js';
import { definition as searchTextDefinition, execute as executeSearchText } from './fs/searchText.js';
import { parseJsonLoose } from '../../shared/json.js';
import { listDirectory, readTextFile, searchTextInWorkspace } from '../../infrastructure/workspace/workspace.js';

const toolModules = [
    {
        definition: clockDefinition,
        execute: executeClock,
        dependencies: {}
    },
    {
        definition: listDirDefinition,
        execute: executeListDir,
        dependencies: { listDirectory }
    },
    {
        definition: readFileDefinition,
        execute: executeReadFile,
        dependencies: { readTextFile }
    },
    {
        definition: searchTextDefinition,
        execute: executeSearchText,
        dependencies: { searchTextInWorkspace }
    }
];

export const toolDefinitions = toolModules.map((toolModule) => toolModule.definition);

const toolHandlers = new Map(toolModules.map((toolModule) => [toolModule.definition.function.name, toolModule]));

export function executeToolCall(toolCall) {
    const toolName = toolCall.function?.name;
    const rawArguments = toolCall.function?.arguments || '{}';

    if (!toolName || !toolHandlers.has(toolName)) {
        return JSON.stringify({ error: `未知工具：${toolName || 'undefined'}` }, null, 2);
    }

    const toolModule = toolHandlers.get(toolName);
    const parsedArguments = parseJsonLoose(rawArguments);
    const result = toolModule.execute(parsedArguments, toolModule.dependencies);

    return typeof result === 'string' ? result : JSON.stringify(result, null, 2);
}