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

const defaultBehaviourMap = new Map();

addNewDefaultBehaviour(type.REGISTER, onRegisterDefault);
addNewDefaultBehaviour(type.NEW_VALUE, onNewValueDefault);
addNewDefaultBehaviour(type.STATE_CHANGED, onStateChangedDefault);
addNewDefaultBehaviour(type.RESET, onResetDefault);

export function addNewDefaultBehaviour(eventType, handler) {
    invariant(!defaultBehaviourMap.has(eventType),
        'Default behaviour for the event %s is already registered',
        eventType
    );

    defaultBehaviourMap.set(eventType, handler);
}

export default function invokeDefaultEventHandler(event, details) {
    const { type, target } = event;
    const defaultBehaviour = defaultBehaviourMap.get(type);
    if (defaultBehaviour && ! defaultIsPrevented(event))
        defaultBehaviour.call(target.getRoot(), event, details);
}