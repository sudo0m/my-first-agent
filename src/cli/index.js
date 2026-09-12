import { runAgent } from '../application/agentRunner.js';

runAgent().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
