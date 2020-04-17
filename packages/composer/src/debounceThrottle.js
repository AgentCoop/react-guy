import invariant from "invariant";

import {
    cloneEvent,
    eventFilter
} from "./events";

import * as attr from './eventAttr';

const throttleEventMap = new Map();
const debounceEventMap = new Map();

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

function debounceThrottlePm(event, pmGenerator, nodeId, map, specs) {
    if (!Array.isArray(specs))
        specs = [specs];

    const promises = [];
    specs.forEach(spec => {
        const { filter, duration } = spec;

        if (!eventFilter(event, filter))
            return;

        if (spec.onDiscard)
            event[attr.DISCARD_CB] = spec.onDiscard;

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

export default function getDebounceThrottlePromise(event) {
    const { currentNode } = event;
    const { debounce, throttle } = currentNode.props;

    invariant(
        !(debounce && throttle),
        "debounce and throttle properties are mutually exclusive"
    );

    if (debounce)
        return debounceThrottlePm(
            event,
            debouncePm,
            currentNode.getId(),
            debounceEventMap,
            debounce
        );
    else if (throttle)
        return debounceThrottlePm(
            event,
            throttlePm,
            currentNode.getId(),
            throttleEventMap,
            throttle
        );
}