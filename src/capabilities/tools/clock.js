export const definition = {
    type: 'function',
    function: {
        name: 'get_local_time',
        description: '获取当前本机时间',
        parameters: {
            type: 'object',
            properties: {},
            additionalProperties: false
        }
    }
};

export function execute() {
    return new Date().toLocaleString('zh-CN', { hour12: false });
}
