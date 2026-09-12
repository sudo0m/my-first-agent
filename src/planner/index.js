import { createPlan } from '../domain/plan.js';

function splitGoalIntoSteps(goal) {
    const fragments = goal
        .split(/[，。；;、\n]/)
        .flatMap((chunk) => chunk.split(/然后|接着|并且|以及|再|之后/))
        .map((part) => part.trim())
        .filter(Boolean);

    const uniqueFragments = [...new Set(fragments)];

    if (uniqueFragments.length > 0) {
        return uniqueFragments.slice(0, 5);
    }

    if (goal.trim()) {
        return [`完成用户目标：${goal.trim()}`];
    }

    return ['理解用户目标', '执行必要步骤', '给出结果'];
}

export function createPlanner() {
    return {
        shouldPlan(goal) {
            return /然后|接着|并且|以及|再|之后|步骤|计划|帮我|完成|整理|修改|实现/.test(goal) || goal.length > 18;
        },
        createPlan(goal) {
            return createPlan(goal, splitGoalIntoSteps(goal));
        }
    };
}
