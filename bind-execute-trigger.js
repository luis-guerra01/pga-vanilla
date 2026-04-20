import {
    buildExecuteTrigger,
} from 'https://static.cloud.coveo.com/headless/v3/headless.esm.js';

export const bindExecuteTrigger = (engine) => {
    const controller = buildExecuteTrigger(engine);

    const executeFunction = (execution) => {
        const { functionName, params } = execution;

        if (functionName === 'log') {
            log(params);
        }
    };

    const unsubscribe = controller.subscribe(() =>
        controller.state.executions.forEach((execution) =>
            executeFunction(execution)
        )
    );

    return unsubscribe;
};
