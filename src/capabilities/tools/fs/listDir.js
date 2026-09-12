export const definition = {
    type: 'function',
    function: {
        name: 'list_dir',
        description: '列出工作区内某个目录的文件和子目录',
        parameters: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: '相对工作区的目录路径，默认当前目录'
                }
            },
            additionalProperties: false
        }
    }
};

export function execute(args, { listDirectory }) {
    return listDirectory(args?.path ?? '.');
}
