import React from "react";
import invariant from "invariant";

import Collection from "./Collection";
import AsyncHandler from "./AsyncHandler";
import invokeDefaultAction from './defaultAction';
import getDebounceThrottlePromise from './debounceThrottle';

import * as type from './eventType';
import * as attr from './eventAttr';
import * as listener from './eventListener';

export const NODE_TYPE_COMPOSER = Symbol("composer");
export const NODE_TYPE_UI_ELEMENT = Symbol("ui_element");
export const NODE_TYPE_UI_ELEMENT_GROUP = Symbol("ui_element_group");

export const isElement = node => node.getType() === NODE_TYPE_UI_ELEMENT;
export const valueRequired = el => el.props.required;
export const isEmpty = el => {
    const value = el.getValue();
    if (typeof value === "array" || typeof value === "string")
        return value.length ? false : true;
    else return false;
};

const eventTypeToPropNameMap = {
    [type.REGISTER]: "onRegister",
    [type.VALUE_CHANGED]: "onValueChanged",
    [type.NEW_VALUE]: "onNewValue",
    [type.STATE_CHANGED]: "onStateChanged",
    [type.CLEAR_ERRORS]: "onClearErrors",
    [type.RESET]: "onReset",
    [type.FINALIZE]: "onFinalize"
};

export function defaultIsPrevented(event) {
    return event[attr.PREVENT_DEFAULT];
}

export function isBubblingStopped(event) {
    return event[attr.STOP_BUBBLING];
}

export function getListenerNameByEventType(type) {
    const name = eventTypeToPropNameMap[type];
    return name;
}

/**
 * Registers new event type
 * @param type
 * @param propName name of component event handler
 */
export function registerNewEvent(type, listenerName, defaultBehaviour = null) {
    invariant(
        !eventTypeToPropNameMap.hasOwnProperty(type),
        "Event type %s already registered",
        type
    );
    eventTypeToPropNameMap[type] = listenerName;
}

export function addEventListener(event, node, handler, capture = false) {}

function stopBubbling() {
    this[attr.STOP_BUBBLING] = true;
}

function preventDefault() {
    this[attr.PREVENT_DEFAULT] = true;
}

function getCreatedAt() {
    return this[attr.CREATED_AT];
}

function getResults() {
    return this[attr.RESULTS];
}

function getLastResult() {
    const results = this[attr.RESULTS];

    return results.length ? results[results.length - 1] : null;
}

/**
 * Adds result of the invocation of last event handler
 * @param result
 */
function addResult(result) {
    this[attr.RESULTS].push(result);
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
        [attr.CREATED_AT]: Date.now(),
        [attr.PREVENT_DEFAULT]: false,
        [attr.STOP_BUBBLING]: false,
        [attr.RESULTS]: [],
        [attr.DISCARD_CB]: function() {
            onDiscard && onDiscard();
        },
        preventDefault,
        stopBubbling,
        getCreatedAt,
        getResults,
        getLastResult
    };
}

export function eventFilter(event, filter) {
    const { target, type } = event;

    if (filter.type && type !== filter.type)
        return false;

    if (filter.targetName && filter.targetName != target.getName())
        return false;

    return true;
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
    };
}

async function invokeNodeEventHandler(node, handler, options, event, details) {
    const { once, fork } = options;
    async function invoke() {
        const asyncHandlerOrResult = handler.call(node, event, details);
        let pm;
        if (asyncHandlerOrResult instanceof  AsyncHandler) {
            pm = asyncHandlerOrResult.run(node, event, details);
        }
        else
            pm = Promise.resolve(asyncHandlerOrResult);
        if (once)
           node.removeEventListener(handler);
        return pm;
    };

    if (fork) {
        thread(async () => {
            invoke();
        });
    } else {
        return invoke();
    }
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
        throw Error(`Failed to retrieve event handler of ${name}`);
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

function getStaticEventListener(event) {
    const { currentNode: node, type } = event;
    const listenerName = eventTypeToPropNameMap[type];

    if (node.isStaticListenerDisabled(type))
        return null;

    if (typeof node[listenerName] === "function")
        return node[listenerName];

    if (typeof node.props[listenerName] === "function")
        return node.props[listenerName];

    return null;
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

async function invokeNodeEventHandlers(node, event, details) {
    // Invoke runtime event hadnlers
    const promises = [];
    const listeners = [...node.getEventListeners(event.type)];
    const handler = getStaticEventListener(event);
    if (handler)
        listeners.push({
            handler,
            options: {
                once: false,
                useCapture: false
            }
        });

    listeners.forEach(({ handler, options }) => {
        const { useCapture } = options;
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
            event[attr.DISCARD_CB](e); // Pass event
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
        if (debounceThrottlePm) {
            try {
                await debounceThrottlePm;
            } catch (e) {
                event[attr.DISCARD_CB](e); // Pass event
                return Promise.resolve(false);
            }
        }

        await invokeNodeEventHandlers(p, event, details);

        if (isBubblingStopped(event))
            return Promise.reject(event);
    } while ((p = p.getParentNode()));

    return Promise.resolve(true);
}

export async function dispatch(target, event, suppressErrors = true) {
    event.target = target;
    const details = getEventDetails(target);
    const root = target.getRoot();
    try {
        await invokeEventHandlerByName(root, listener.ON_PROPAGATION_STARTED, event, details);
        await capturePhase(target, event, details);
        await bubblePhase(target, event, details);

        // Invoke default action if necessary
        if (!event[attr.PREVENT_DEFAULT])
            invokeDefaultAction(event, details);

        await invokeEventHandlerByName(root, listener.ON_PROPAGATION_FINISHED, event, details);
    } catch (e) {
        if (process.env.NODE_ENV === 'test')
            return Promise.resolve(true);
        else if (suppressErrors)
            return Promise.resolve(false);
        else
            return Promise.reject(e);
    }

    return Promise.resolve(true);
}
