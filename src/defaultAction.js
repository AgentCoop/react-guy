import merge from "merge";
import invariant from 'invariant';

import {
    defaultIsPrevented
} from "./events";

import * as type from './eventType';
import * as attr from './eventAttr';

function onRegisterDefault(event, details) {
    const {
        target,
        payload: { value }
    } = event;
    const root = target.getRoot();
    root.registerElement(target);
    if (target.isValueless()) {
        event[attr.RESOLVE_CB] && event[attr.RESOLVE_CB]();
        return;
    }

    let { valueBag } = details;
    if (!valueBag) {
        valueBag = {};
        valueBag[target.getName()] = value;
    }
    root.values = merge.recursive(true, root.values, valueBag);
    event[attr.RESOLVE_CB] && event[attr.RESOLVE_CB]();
}

function onNewValueDefault(event, details) {
    const { target, payload } = event;
    let { valueBag } = details;
    target.setValue(payload, function() {
        if (event[attr.RESOLVE_CB])
            event[attr.RESOLVE_CB]();
    });
    const root = target.getRoot();
    if (!valueBag) {
        valueBag = {};
        valueBag[target.getName()] = payload;
    }
    root.values = merge.recursive(true, root.values, valueBag);
}

function onStateChangedDefault(event, details) {
    const { target, payload } = event;
    target._setState(payload, function() {
        if (event[attr.RESOLVE_CB])
            event[attr.RESOLVE_CB]();
    });
}

function onResetDefault(event, details) {
    const { target } = event;
    const root = target.getRoot();
    root.registeredElements.forEach(el => el.reset());
}

const defaultActionMap = new Map();

addNewDefaultAction(type.REGISTER, onRegisterDefault);
addNewDefaultAction(type.NEW_VALUE, onNewValueDefault);
addNewDefaultAction(type.STATE_CHANGED, onStateChangedDefault);
addNewDefaultAction(type.RESET, onResetDefault);

export function addNewDefaultAction(eventType, handler) {
    invariant(!defaultActionMap.has(eventType),
        'Default behaviour for the event %s is already registered',
        eventType
    );

    defaultActionMap.set(eventType, handler);
}

export default function invokeDefaultAction(event, details) {
    const { type, target } = event;
    const action = defaultActionMap.get(type);
    if (action && ! defaultIsPrevented(event))
        action.call(target.getRoot(), event, details);
}