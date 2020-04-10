import {
    promisifyHandler,
    invokeSyncEventHandlerByName,
    cloneEvent,
    EVENT_HANDLER_ON_ASYNC_HANDLER_STARTED,
    EVENT_HANDLER_ON_ASYNC_HANDLER_FAILED,
    EVENT_HANDLER_ON_ASYNC_HANDLER_FINISHED
} from "./events";

import * as listener from './eventListener';

import {fork} from "./utils";

class AsyncHandler {
    constructor(handler, fork = false) {
        this.handler = promisifyHandler(handler);
        this.fork = fork;
    }

    runBody = async (node, event, details) => {
        try {
            invokeSyncEventHandlerByName(node, listener.ON_ASYNC_HANDLER_STARTED, event, details);
            const result = await this.handler(event, details);
            invokeSyncEventHandlerByName(node, listener.ON_ASYNC_HANDLER_FINISHED, event, details);
            return result;
        } catch (e) {
            invokeSyncEventHandlerByName(node, listener.ON_ASYNC_HANDLER_FAILED, event, details);
            throw e;
        }
    }

    run = (node, event, details) => {
        const self = this;
        async function run(event, onSuccess = null, onFailure = null) {
            return new Promise(async function (resolve, reject) {
                try {
                    const result = await self.runBody(node, event, details);
                    const _result = { node, result };
                    if (onSuccess)
                        onSuccess(_result);
                    resolve();
                } catch (e) {
                    const result = { node, result: e };
                    if (onFailure)
                        onFailure(result, { resolve, reject });
                    else
                        reject({ node, result: e });
                }
            });
        };

        if (this.fork) {
            const clonedEvent = cloneEvent(event);
            fork(() => {
                function onSuccess(result) {
                    invokeSyncEventHandlerByName(node, listener.ON_FORK_FINISHED, event, details);
                }
                function onFailure(result, { resolve, reject }) {
                    invokeSyncEventHandlerByName(node, listener.ON_FORK_FAILED, event, details);
                    resolve();
                }
                invokeSyncEventHandlerByName(node, listener.ON_FORK_STARTED, event, details);
                run(clonedEvent, onSuccess, onFailure);
            });
        } else {
            return run(event);
        }
    }
}

export default AsyncHandler;