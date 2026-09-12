export function createPlan(goal, steps = []) {
    return {
        goal,
        steps: steps.map((step, index) => ({
            id: index + 1,
            text: step,
            status: 'pending'
        })),
        createdAt: new Date().toISOString()
    };
}

export function formatPlan(plan) {
    return plan.steps
        .map((step) => `${step.id}. ${step.text} [${step.status}]`)
        .join('\n');
}

export function getNextPendingStep(plan) {
    return plan.steps.find((step) => step.status === 'pending') || null;
}

export function markStepInProgress(plan, stepId) {
    const step = plan.steps.find((item) => item.id === stepId);
    if (step) {
        step.status = 'in_progress';
    }

    return plan;
}

export function markStepCompleted(plan, stepId) {
    const step = plan.steps.find((item) => item.id === stepId);
    if (step) {
        step.status = 'completed';
    }

    return plan;
}

export function hasPendingSteps(plan) {
    return plan.steps.some((step) => step.status !== 'completed');
}

export function buildStepPrompt(plan, step) {
    return [
        `当前目标：${plan.goal}`,
        `当前步骤：${step.id}/${plan.steps.length} - ${step.text}`,
        '请只围绕当前步骤执行。必要时可以调用工具。完成后给出该步骤结果。'
    ].join('\n');
}
