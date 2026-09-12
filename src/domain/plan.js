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
