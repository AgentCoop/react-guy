import React from "react";
import invariant from "invariant";
import merge from "merge";

import Collection from "./Collection";

export const NODE_TYPE_COMPOSER = Symbol("composer");
export const NODE_TYPE_UI_ELEMENT = Symbol("ui_element");
export const NODE_TYPE_UI_ELEMENT_GROUP = Symbol("ui_element_group");

export const NODE_ID_ATTR = Symbol("id");
export const NODE_NAME_ATTR = Symbol("name");
export const NODE_CHILDS_ATTR = Symbol("childs");
export const NODE_PREV_SIBLING_ATTR = Symbol("prev_sibling");
export const NODE_NEXT_SIBLING_ATTR = Symbol("next_sibling");
export const NODE_PARENT_NODE_ATTR = Symbol("parent_node");
export const NODE_REGISTERED_LISTENERS_ATTR = Symbol("registered_listeners");

export const EVENT_TYPE_REGISTER = Symbol("register");
export const EVENT_TYPE_VALUE_CHANGED = Symbol("value_changed");
export const EVENT_TYPE_NEW_VALUE = Symbol("new_value");
export const EVENT_TYPE_STATE_CHANGED = Symbol("state_changed");
export const EVENT_TYPE_CLEAR_ERRORS = Symbol("clear_errors");
export const EVENT_TYPE_RESET = Symbol("reset");
export const EVENT_TYPE_FINALIZE = Symbol("finalize");

const EVENT_ATTR_PREVENT_DEFAULT = Symbol("prevent_default");
const EVENT_ATTR_STOP_BUBBLING = Symbol("stop_bubbling");
const EVENT_ATTR_CREATED_AT = Symbol("created_at");
const EVENT_ATTR_RESULTS = Symbol("results");
const EVENT_ATTR_DISCARD_CB = Symbol("discard_cb");
const EVENT_ATTR_RESOLVE_CB = Symbol("resolve_cb");
const EVENT_ATTR_REJECT_CB = Symbol("reject_cb");

export const EVENT_HANDLER_ON_ASYNC_VALIDATE_STARTED = "onAsyncValidateStarted";
export const EVENT_HANDLER_ON_ASYNC_VALIDATE_FINISHED =
    "onAsyncValidateFinished";

export const isElement = node => node.getType() === NODE_TYPE_UI_ELEMENT;
export const valueRequired = el => el.props.required;
export const isEmpty = el => {
    const value = el.getValue();
    if (typeof value === "array" || typeof value === "string")
        return value.length ? false : true;
    else return false;
};

export async function runCustomValidator(validator, node, event, details) {
    const executor = createHandlerExecutor(validator, true);
    return executor(node, event, details)();
}

function asyncHandler(result) {
    return typeof result === "function" || typeof result === "array";
}

const eventTypeToPropNameMap = {
    [EVENT_TYPE_REGISTER]: "onRegister",
    [EVENT_TYPE_VALUE_CHANGED]: "onValueChanged",
    [EVENT_TYPE_NEW_VALUE]: "onNewValue",
    [EVENT_TYPE_STATE_CHANGED]: "onStateChanged",
    [EVENT_TYPE_CLEAR_ERRORS]: "onClearErrors",
    [EVENT_TYPE_RESET]: "onReset",
    [EVENT_TYPE_FINALIZE]: "onFinalize"
};

const throttleEventMap = new Map();
const debounceEventMap = new Map();

//
// Default event handlers
//
function onRegisterDefault(event, details) {
    const {
        target,
        payload: { value }
    } = event;
    const root = target.getRoot();
    root.registerElement(target);
    if (target.isValueless()) {
        event[EVENT_ATTR_RESOLVE_CB]();
        return;
    }

    let { valueBag } = details;
    if (!valueBag) {
        valueBag = {};
        valueBag[target.getName()] = value;
    }
    root.values = merge.recursive(true, root.values, valueBag);
    event[EVENT_ATTR_RESOLVE_CB]();
}

function onNewValueDefault(event, details) {
    const { target, payload } = event;
    let { valueBag } = details;
    target.setValue(payload, function() {
        if (event[EVENT_ATTR_RESOLVE_CB]) event[EVENT_ATTR_RESOLVE_CB]();
    });
    const root = target.getRoot();
    if (!valueBag) {
        valueBag = {};
        valueBag[target.getName()] = payload;
    }
    root.values = merge.recursive(true, root.values, valueBag);
}

function onValueChangedDefault(event, details) {
    const { target, payload } = event;
    target.setValue(payload, function() {
        if (event[EVENT_ATTR_RESOLVE_CB]) event[EVENT_ATTR_RESOLVE_CB]();
    });
}

function onStateChangedDefault(event, details) {
    const { target, payload } = event;
    target._setState(payload, function() {
        if (event[EVENT_ATTR_RESOLVE_CB]) event[EVENT_ATTR_RESOLVE_CB]();
    });
}

function onResetDefault(event, details) {
    const { target } = event;
    const root = target.getRoot();
    root.registeredElements.forEach(el => el.reset());
}

// default event handlers
export const defaultBehaviourMap = {
    [EVENT_TYPE_REGISTER]: onRegisterDefault,
    [EVENT_TYPE_NEW_VALUE]: onNewValueDefault,
    [EVENT_TYPE_VALUE_CHANGED]: onValueChangedDefault,
    [EVENT_TYPE_STATE_CHANGED]: onStateChangedDefault,
    [EVENT_TYPE_RESET]: onResetDefault
};

export function defaultIsPrevented(event) {
    return event[EVENT_ATTR_PREVENT_DEFAULT];
}

export function isBubblingStopped(event) {
    return event[EVENT_ATTR_STOP_BUBBLING];
}

/**
 * Registers new event type
 * @param type
 * @param propName name of component event handler
 */
export function registerNewEvent(type, propName, defaultBehaviour = null) {
    invariant(
        !eventTypeToPropNameMap.hasOwnProperty(type),
        "Event %s already registered",
        type
    );
    eventTypeToPropNameMap[type] = propName;
}

export function addEventListener(event, node, handler, capture = false) {}

function stopBubbling() {
    this[EVENT_ATTR_STOP_BUBBLING] = true;
}

function preventDefault() {
    this[EVENT_ATTR_PREVENT_DEFAULT] = true;
}

function getCreatedAt() {
    return this[EVENT_ATTR_CREATED_AT];
}

function getResults() {
    return this[EVENT_ATTR_RESULTS];
}

function getLastResult() {
    const results = this[EVENT_ATTR_RESULTS];

    return results.length ? results[results.length - 1] : null;
}

/**
 * Adds result of the invocation of last event handler
 * @param result
 */
function addResult(result) {
    this[EVENT_ATTR_RESULTS].push(result);
}

function cloneEvent(event) {
    const cloned = { ...event };
    for (let sym of Object.getOwnPropertySymbols(event)) cloned[sym] = event[sym];
    return cloned;
}

export function createEvent(type, payload, { onDiscard } = {}) {
    return {
        type,
        payload,
        currentNode: this,
        [EVENT_ATTR_CREATED_AT]: Date.now(),
        [EVENT_ATTR_PREVENT_DEFAULT]: false,
        [EVENT_ATTR_STOP_BUBBLING]: false,
        [EVENT_ATTR_RESULTS]: [],
        [EVENT_ATTR_DISCARD_CB]: function() {
            onDiscard && onDiscard();
        },
        preventDefault,
        stopBubbling,
        getCreatedAt,
        getResults,
        getLastResult
    };
}

function eventFilter(event, filter) {
    const { target, type } = event;

    if (filter.type && type !== filter.type) return false;

    if (filter.targetName && filter.targetName != target.getName()) return false;

    return true;
}

function debouncePm(duration, event) {
    return () => {
        let timeout = null;
        let lastReject = null;
        return () =>
            new Promise(function(resolve, reject) {
                if (timeout) {
                    clearTimeout(timeout);
                    lastReject(event);
                }
                lastReject = reject;
                timeout = setTimeout(function() {
                    resolve(event);
                    timeout = null;
                }, duration);
            });
    };
}

function throttlePm(duration, event) {
    return () => {
        let wait = false;
        const clonedEvent = cloneEvent(event);
        return () =>
            new Promise(function(resolve, reject) {
                if (!wait) {
                    resolve(clonedEvent);
                    wait = true;
                    setTimeout(function() {
                        wait = false;
                    }, duration);
                } else reject(clonedEvent);
            });
    };
}

function throttleDebouncePm(event, pmGenerator, nodeId, map, specs) {
    const { filter, duration } = specs;

    if (specs.onDiscard) event[EVENT_ATTR_DISCARD_CB] = specs.onDiscard;

    let nodeMap;
    if (!map.has(nodeId)) {
        nodeMap = new Map();
        map.set(nodeId, nodeMap);
    } else nodeMap = map.get(nodeId);

    let pm;
    if (nodeMap.has(filter)) {
        pm = nodeMap.get(filter);
    } else {
        pm = pmGenerator(duration, event)();
        nodeMap.set(filter, pm);
    }

    return pm();
}

function invokeAsyncEventHandlerDryRun(event, details, handlerObj) {
    if (typeof handlerObj === "function") {
        handlerObj = [handlerObj];
    }
    const dummyPromiseCallbacks = {
        resolve: function() {},
        reject: function() {}
    };
    handlerObj.forEach(handler => {
        addResult.call(event, handler(event, details, dummyPromiseCallbacks));
    });

    return Promise.resolve(event);
}

export async function invokeAsyncEventHandler(event, details, handlerObj) {
    const ctx = this;
    const promiseFn = handler =>
        function(resolve, reject) {
            function resolveWrapper(result) {
                resolve(result);
                addResult.call(event, result);
            }
            handler.call(ctx, event, details, { resolve: resolveWrapper, reject });
        };

    if (typeof handlerObj === "function") {
        return new Promise(promiseFn(handlerObj));
    } else {
        return Promise.all(handlerObj.map(handler => promiseFn(handler)));
    }
}

function getDebounceThrottlePromise(event) {
    const { currentNode } = event;
    const { debounce, throttle } = currentNode.props;

    invariant(
        !(debounce && throttle),
        "debounce and throttle properties are mutually exclusive"
    );

    if (debounce && eventFilter(event, debounce.filter))
        return throttleDebouncePm(
            event,
            debouncePm,
            currentNode.getId(),
            debounceEventMap,
            debounce
        );
    else if (throttle && eventFilter(event, throttle.filter))
        return throttleDebouncePm(
            event,
            throttlePm,
            currentNode.getId(),
            throttleEventMap,
            throttle
        );
}

function getEventDetails(target) {
    const sourceSiblings = new Collection(target.getSiblings());
    const details = {
        sourceSiblings
    };

    return details;
}

export function getEventHandlerByName(node, name) {
    if (typeof node[name] === "function") {
        return node[name];
    } else if (typeof node.props[name] === "function") {
        return node.props[name];
    } else {
        invariant(false, "Failed to retrieve event handler of %s", name);
    }
}

export function findEventHandlerByName(node, name) {
    try {
        return getEventHandlerByName(node, name);
    } catch (e) {
        return null;
    }
}

export function invokeEventHandlerByName(node, name, event, details) {
    const handler = findEventHandlerByName(node, name);
    if (!handler) return null;
    return handler.call(node, event, details);
}

function getEventHandler(event) {
    const { currentNode, type } = event;
    const propName = eventTypeToPropNameMap[type];
    let handler;

    if (typeof currentNode[propName] !== "undefined") {
        handler = currentNode[propName];
    } else if (typeof currentNode.props[propName] !== "undefined") {
        handler = currentNode.props[propName];
    }

    return handler;
}

function createHandlerExecutor(
    asyncHandlerOrResult,
    forceSyncExec,
    postExec = () => {
        console.log("post");
    }
) {
    return (node, event, details) =>
        async function() {
            let rejected = false;
            let result;
            try {
                if (asyncHandler(asyncHandlerOrResult)) {
                    if (forceSyncExec)
                        result = await invokeAsyncEventHandler(
                            event,
                            details,
                            asyncHandlerOrResult
                        );
                    else
                        result = await invokeAsyncEventHandlerDryRun(
                            event,
                            details,
                            asyncHandlerOrResult
                        );
                } else result = asyncHandlerOrResult;
            } catch (error) {
                console.log("rejected", error);
                result = error;
                rejected = true;
            } finally {
                postExec(node, event, details);
            }
            return rejected
                ? Promise.reject({ result, node })
                : Promise.resolve({ result, node, event });
        };
}

async function capturePhase(target, event, details, forceSync = false) {
    // The path from the root node to the target one not including itself
    const descendants = target.getDescendantsPath(false);
    const promises = [];
    descendants.forEach(function(node) {
        node
            .getEventListeners(event.type)
            .filter(({ options }) => options.useCapture)
            .forEach(({ handler, options }) => {
                const { once, sync } = options;
                if (forceSync || sync) {
                    const pm = invokeAsyncEventHandler.call(
                        node,
                        event,
                        details,
                        handler
                    );
                    promises.push(pm);
                } else {
                    const pm = invokeAsyncEventHandlerDryRun.call(
                        node,
                        event,
                        details,
                        handler
                    );
                    promises.push(pm);
                }
                if (once) node.removeEventListener(handler);
            });
    });
    return Promise.all(promises);
}

async function bubblePhase(target, event, details) {
    if (isBubblingStopped(event)) return false;
    let p = target;
    do {
        event.currentNode = p;

        const debounceThrottlePm = getDebounceThrottlePromise(event);
        if (debounceThrottlePm)
            try {
                await debounceThrottlePm;
            } catch (e) {
                event[EVENT_ATTR_DISCARD_CB](e); // Pass event
                return false;
            }

        const handler = getEventHandler(event);
        if (!handler) continue;
        const result = handler(event, details);
        addResult.call(event, result);

        const asyncCall =
            typeof result === "function" ||
            (typeof result === "array" && typeof result[0] === "function");

        if (asyncCall) {
            try {
                await invokeAsyncEventHandler(event, details, result);
            } catch (e) {
                event[EVENT_ATTR_DISCARD_CB]();
                return false;
            }
        }

        if (isBubblingStopped(event)) return false;
    } while ((p = p.getParentNode()));

    return true;
}

export function dispatch(target, event) {
    event.target = target;
    const details = getEventDetails(target);
    capturePhase(target, event, details);
    bubblePhase(target, event, details);
    invokeDefaultEventHandler(event, details);
}

/**
 * Dispatches an event and awaits until the event will be handled or discarded
 * @returns {Promise}
 */
export async function dispatchSync(target, event) {
    event.target = target;
    const pm = new Promise(async function(resolve, reject) {
        const details = getEventDetails(target);
        event[EVENT_ATTR_RESOLVE_CB] = resolve;
        event[EVENT_ATTR_REJECT_CB] = reject;
        try {
            await capturePhase(target, event, details, true);
            if (!bubblePhase(target, event, details)) {
                reject();
            }
        } catch (e) {
            console.log("cought error");
        } finally {
            invokeDefaultEventHandler(event, details);
        }
    });

    return pm;
}

export function invokeDefaultEventHandler(event, details) {
    const defaultBehaviour = defaultBehaviourMap[event.type];

    if (!defaultBehaviour || defaultIsPrevented(event)) return;

    return defaultBehaviour(event, details);
}
