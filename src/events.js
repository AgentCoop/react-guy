import React from "react";
import invariant from "invariant";
import merge from "merge";

import Collection from "./Collection";
import AsyncHandler from "./AsyncHandler";

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

export const EVENT_ATTR_PREVENT_DEFAULT = Symbol("prevent_default");
export const EVENT_ATTR_STOP_BUBBLING = Symbol("stop_bubbling");
export const EVENT_ATTR_CREATED_AT = Symbol("created_at");
export const EVENT_ATTR_RESULTS = Symbol("results");
export const EVENT_ATTR_DISCARD_CB = Symbol("discard_cb");
export const EVENT_ATTR_RESOLVE_CB = Symbol("resolve_cb");
export const EVENT_ATTR_REJECT_CB = Symbol("reject_cb");

export const EVENT_HANDLER_ON_PROPAGATION_STARTED = "onPropagationStarted";
export const EVENT_HANDLER_ON_PROPAGATION_FINISHED = "onPropagationFinished";
export const EVENT_HANDLER_ON_ASYNC_HANDLER_STARTED = "onAsyncHandlerStarted";
export const EVENT_HANDLER_ON_ASYNC_HANDLER_FAILED = "onAsyncHandlerFailed";
export const EVENT_HANDLER_ON_ASYNC_HANDLER_FINISHED = "onAsyncHandlerFinished";
export const EVENT_HANDLER_ON_ASYNC_VALIDATE_STARTED = "onAsyncValidateStarted";
export const EVENT_HANDLER_ON_ASYNC_VALIDATE_FINISHED = "onAsyncValidateFinished";
export const EVENT_HANDLER_ON_VALIDATION_FAILED = 'onValidationFailed';
export const EVENT_HANDLER_ON_VALUE_CHANGED = "onValueChanged";

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
        event[EVENT_ATTR_RESOLVE_CB] && event[EVENT_ATTR_RESOLVE_CB]();
        return;
    }

    let { valueBag } = details;
    if (!valueBag) {
        valueBag = {};
        valueBag[target.getName()] = value;
    }
    root.values = merge.recursive(true, root.values, valueBag);
    event[EVENT_ATTR_RESOLVE_CB] && event[EVENT_ATTR_RESOLVE_CB]();
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
    //[EVENT_TYPE_VALUE_CHANGED]: onValueChangedDefault,
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

export function cloneEvent(event) {
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
    if (!Array.isArray(specs))
        specs = [specs];

    const promises = [];
    specs.forEach(spec => {
        const { filter, duration } = spec;

        if (!eventFilter(event, filter))
            return;

        if (spec.onDiscard)
            event[EVENT_ATTR_DISCARD_CB] = spec.onDiscard;

        let nodeMap;
        if (!map.has(nodeId)) {
            nodeMap = new Map();
            map.set(nodeId, nodeMap);
        } else
            nodeMap = map.get(nodeId);

        let pm;
        if (nodeMap.has(filter)) {
            pm = nodeMap.get(filter);
        } else {
            pm = pmGenerator(duration, event)();
            nodeMap.set(filter, pm);
        }
        promises.push(pm());
    });

    return Promise.all(promises);
}

export function promisifyHandler(handler) {
    const ctx = this;
    return (event, details) => {
        const clonedEvent = cloneEvent(event);
        return new Promise(function (resolve, reject) {
            function resolveWrapper(result) {
                addResult.call(event, result);
                resolve(result);
            }
            handler.call(ctx, clonedEvent, details, {
                resolve: resolveWrapper,
                reject
            });
        });
    }
}

async function invokeNodeEventHandler(node, handler, options, event, details) {
    const { once, fork } = options;
    async function invoke() {
        const asyncHandlerOrResult = handler.call(node, event, details);
        let pm;
        if (asyncHandlerOrResult instanceof  AsyncHandler) {
            //console.log(asyncHandlerOrResult.foo(), 'sss')
            pm = asyncHandlerOrResult.run.call(node, event, details);
        }
        else
            pm = Promise.resolve(asyncHandlerOrResult);
        if (once)
            node.removeEventHandler(node, handler);
        return pm;
    }

    if (fork) {
        thread(async () => {
            invoke();
        });
    } else {
        return invoke();
    }
}

function getDebounceThrottlePromise(event) {
    const { currentNode } = event;
    const { debounce, throttle } = currentNode.props;

    invariant(
        !(debounce && throttle),
        "debounce and throttle properties are mutually exclusive"
    );

    if (debounce)
        return throttleDebouncePm(
            event,
            debouncePm,
            currentNode.getId(),
            debounceEventMap,
            debounce
        );
    else if (throttle)
        return throttleDebouncePm(
            event,
            throttlePm,
            currentNode.getId(),
            throttleEventMap,
            throttle
        );
}

function getEventDetails(target) {
    const targetSiblings = new Collection(target.getSiblings());
    const details = { targetSiblings };
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

export async function invokeEventHandlerByName(node, name, event, details) {
    const handler = findEventHandlerByName(node, name);
    if (!handler)
        return null;
    else
        return invokeNodeEventHandler(node, handler, {}, event, details);
}

export async function invokeSyncEventHandlerByName(node, name, event, details) {
    const handler = findEventHandlerByName(node, name);

    return handler ? handler.call(node, event, details) : null;
}

function getEventHandler(event) {
    const { currentNode, type } = event;
    const handlerName = eventTypeToPropNameMap[type];
    return findEventHandlerByName(currentNode, handlerName);
}

async function capturePhase(target, event, details, forceSync = false) {
    // The path from the root node to the target node not including it.
    const descendants = target.getDescendantsPath(false);
    const promises = [];
    descendants.forEach(function(node) {
        node
            .getEventListeners(event.type)
            .filter(({ options }) => options.useCapture)
            .forEach(({ handler, options }) => {
                const pm = invokeNodeEventHandler(node, handler, options, event, details);
                promises.push(pm);
            });
    });
    return Promise.all(promises);
}

function thread(cb) {
    setTimeout(cb, 0);
}

async function invokeNodeEventHandlers(node, event, details) {
    // Invoke runtime event hadnlers
    const promises = [];
    const listeners = node.getEventListeners(event.type);
    const handler = getEventHandler(event);
    if (handler)
        listeners.push({
            handler,
            options: {
                once: false,
                useCapture: false
            }
        });

    listeners.forEach(({ handler, options }) => {
        const { once, useCapture } = options;
        if (useCapture)
            return;
        const pm = invokeNodeEventHandler(node, handler, options, event, details);
        promises.push(pm);
    });

    if (promises.length) {
        try {
            await Promise.all(promises);
        } catch (e) {
            console.log("cought error2", e);
            event[EVENT_ATTR_DISCARD_CB](e); // Pass event
            throw e;
        }
    }
}

async function bubblePhase(target, event, details, forceSync = false) {
    if (isBubblingStopped(event))
        return Promise.reject(event);
    let p = target;
    do {
        event.currentNode = p;
        const debounceThrottlePm = getDebounceThrottlePromise(event);
        if (debounceThrottlePm)
            try {
                await debounceThrottlePm;
            } catch (e) {
                event[EVENT_ATTR_DISCARD_CB](e); // Pass event
                return Promise.resolve(false);
            }

        await invokeNodeEventHandlers(p, event, details);

        if (isBubblingStopped(event))
            return Promise.reject(event);
    } while ((p = p.getParentNode()));

    return Promise.resolve(true);
}

export async function dispatch(target, event, suppressDiscarded = true) {
    event.target = target;
    const details = getEventDetails(target);
    const root = target.getRoot();
    try {
        await invokeEventHandlerByName(root, EVENT_HANDLER_ON_PROPAGATION_STARTED, event, details);
        await capturePhase(target, event, details);
        await bubblePhase(target, event, details);
        invokeDefaultEventHandler.call(root, event, details);
        await invokeEventHandlerByName(root, EVENT_HANDLER_ON_PROPAGATION_FINISHED, event, details);
    } catch (e) {
        console.log(e, 'error')
        if (suppressDiscarded)
            return Promise.resolve(false);
        else
            return Promise.reject(e);
    }

    return Promise.resolve(true);
}

export function invokeDefaultEventHandler(event, details) {
    const { type } = event;
    const defaultBehaviour = defaultBehaviourMap[type];

    if (defaultBehaviour && ! defaultIsPrevented(event))
        defaultBehaviour(event, details);
}
