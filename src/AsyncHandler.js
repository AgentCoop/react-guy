import {
    promisifyHandler,
    invokeSyncEventHandlerByName,
    cloneEvent,
    EVENT_HANDLER_ON_ASYNC_HANDLER_STARTED,
    EVENT_HANDLER_ON_ASYNC_HANDLER_FAILED,
    EVENT_HANDLER_ON_ASYNC_HANDLER_FINISHED
} from "./events";

import {fork} from "./utils";

class AsyncHandler {
    constructor(handler, fork = false) {
        this.handler = promisifyHandler(handler);
        this.fork = fork;
    }

    runBody = async (node, event, details) => {
        try {
            invokeSyncEventHandlerByName(node, EVENT_HANDLER_ON_ASYNC_HANDLER_STARTED, event, details);
            const result = await this.handler(event, details);
            invokeSyncEventHandlerByName(node, EVENT_HANDLER_ON_ASYNC_HANDLER_FINISHED, event, details);
            return result;
        } catch (e) {
            invokeSyncEventHandlerByName(node, EVENT_HANDLER_ON_ASYNC_HANDLER_FAILED, event, details);
            throw e;
        }
    }

    run = (node, event, details) => {
        const self = this;
        if (this.fork) {
            const clonedEvent = cloneEvent(event);
            fork(() => {
                self.runBody(clonedEvent, details);
            });
        } else {
            return new Promise(async function (resolve, reject) {
                try {
                    const result = await self.runBody(node, event, details);
                    resolve({ node, result });
                } catch (e) {
                    reject({ node, result: e });
                }
            });
        }
    }
}

export default AsyncHandler;