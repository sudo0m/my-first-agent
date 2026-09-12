# Agents

一个可扩展的 Node.js agent 学习项目。

## 目录分层

- `src/cli`：启动入口
- `src/application`：流程编排
- `src/domain`：核心数据结构
- `src/memory`：文件化记忆
- `src/planner`：任务规划
- `src/stream`：SSE 事件流
- `src/capabilities`：具体能力/工具
- `src/infrastructure`：外部交互实现
- `src/shared`：通用工具
- `src/config`：配置读取

## 运行

```bash
npm install
npm run start
```

## 检查

```bash
npm run check
npm run smoke
```

## 环境变量

复制 `.env.example` 到 `.env` 并填写：

- `BASE_URL`
- `BASE_KEY`
- `MODEL`
- `SSE_PORT`（可选，开启 SSE 事件流服务）
