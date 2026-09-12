export const definition = {
    type: 'function',
    function: {
        name: 'read_file',
        description: '读取工作区内文件的指定行范围',
        parameters: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: '相对工作区的文件路径'
                },
                offset: {
                    type: 'integer',
                    minimum: 1,
                    description: '起始行号，默认 1'
                },
                limit: {
                    type: 'integer',
                    minimum: 1,
                    description: '最多读取多少行，默认 200'
                }
            },
            required: ['path'],
            additionalProperties: false
        }
    }
};

export function execute(args, { readTextFile }) {
    return readTextFile(args.path, { offset: args.offset, limit: args.limit });
}
