export const definition = {
    type: 'function',
    function: {
        name: 'search_text',
        description: '在工作区内搜索文本内容，适合查找函数名、报错、变量名',
        parameters: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: '要搜索的文本'
                },
                path: {
                    type: 'string',
                    description: '可选的起始路径，默认当前目录'
                },
                maxResults: {
                    type: 'integer',
                    minimum: 1,
                    description: '最多返回多少条结果，默认 20'
                },
                caseSensitive: {
                    type: 'boolean',
                    description: '是否区分大小写，默认 false'
                }
            },
            required: ['query'],
            additionalProperties: false
        }
    }
};

export function execute(args, { searchTextInWorkspace }) {
    return searchTextInWorkspace({
        query: args.query,
        targetPath: args.path,
        maxResults: args.maxResults,
        caseSensitive: args.caseSensitive
    });
}
