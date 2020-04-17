import React from "react";
import invariant from "invariant";

import AbstractNode from "../AbstractNode";
import AsyncHandler from "../AsyncHandler";
import {
    NODE_TYPE_COMPOSER,
    valueRequired,
    isEmpty,
    invokeEventHandlerByName,
    invokeSyncEventHandlerByName,
} from "../events";

import {
    PREV_SIBLING,
    NEXT_SIBLING
} from "../nodeAttr"

import * as listener from '../eventListener';
import * as type from '../eventType';
import * as attr from '../eventAttr';

function onValueChanged(event, details) {
    const { target, payload } = event;
    target.setValue(payload, function() {
        if (event[attr.RESOLVE_CB])
            event[attr.RESOLVE_CB]();
    });
}

/**
 * Vaidates form data
 */
async function onFinalizeEvent(event, details) {
    const promises = [];
    const asyncValidatorNodes = [];
    let validFailed = false;

    this.traverseValuesTree(function(value, fqn) {
        const node = this.getElementByName(fqn);
        if (valueRequired(node) && isEmpty(node)) {
            node.setError({ validationErr: "required value" });
            invokeSyncEventHandlerByName(node, listener.ON_VALIDATION_FAILED, event, details);
            validFailed = true;
        } else if (node.props.validate) { // Custom validator
            const value = node.getValue();
            const asyncOrValue = node.props.validate.call(node, value);
            if (asyncOrValue instanceof AsyncHandler) {
                asyncValidatorNodes.push(node);
                const pm = asyncOrValue.run(node, event, details);
                promises.push(pm);
            } else if (asyncOrValue !== true) {
                node.setError({validationErr: asyncOrValue});
                invokeSyncEventHandlerByName(node, listener.ON_VALIDATION_FAILED, event, details);
                validFailed = true;
            }
        }
    });

    if (validFailed)
        return Promise.reject(null);

    try {
        asyncValidatorNodes.push(this);
        asyncValidatorNodes.forEach(node => {
            invokeSyncEventHandlerByName(node, listener.ON_ASYNC_VALIDATE_STARTED, event, details);
        });
        const results = await Promise.all(promises);
        asyncValidatorNodes.forEach(node => {
            invokeSyncEventHandlerByName(node, listener.ON_ASYNC_VALIDATE_FINISHED, event, details);
        });
    } catch (e) {
        const { node, result } = e;
        node.setError({ validationErr: result });
        invokeSyncEventHandlerByName(node, listener.ON_ASYNC_VALIDATE_FAILED, event, details);
        validFailed = true;
    } finally {
        return validFailed ? Promise.reject(null) : Promise.resolve(null);
    }
}

class Composer extends AbstractNode {
    constructor(props) {
        super(props);
        const { initialValues } = props;
        this.$type = NODE_TYPE_COMPOSER;
        this.nodeContext = { initialValues };
        this.values = {};
        this.namespace = "";
        this.registeredElements = new Map();

        this.addEventListener(type.FINALIZE, onFinalizeEvent, { useCapture: true });
        this.addEventListener(type.VALUE_CHANGED, onValueChanged, { useCapture: true });
    }

    componentDidMount() {
        // Link component tree nodes once it was rendered
        this.traverseTree(this, function(
            parent,
            current,
            prevSibling,
            nextSibling
        ) {
            current[PREV_SIBLING] = prevSibling;
            current[NEXT_SIBLING] = nextSibling;
        });
    }

    registerElement = el => {
        const fqn = el.getName(true);
        if (!fqn)
            return;
        invariant(
            !this.registeredElements.has(fqn),
            "Element %s already registered",
            fqn
        );
        this.registeredElements.set(fqn, el);
    };

    findElementByName = fqn => {
        return this.registeredElements.get(fqn);
    };

    getElementByName = fqn => {
        const el = this.findElementByName(fqn);
        invariant(el, `Failed to find element ${fqn}`);
        return el;
    };

    traverseValuesTree = cb => {
        const traverse = (root, ns) => {
            for (let key of Object.keys(root)) {
                const fqn = ns + "." + key;
                if (typeof root[key] === "object") {
                    traverse(root[key], fqn);
                } else {
                    try {
                        cb.call(this, root[key], fqn);
                    } catch (e) {
                        console.log(e, 'traverse values')
                    }
                }
            }
        };
        traverse(this.values, /* start from the global namespace */ "");
    };

    onClearErrors = (event, details) => {
        const { target } = event;
        target.clearErrors();
    };

    render() {
        const { children } = this.props;
        const renderProps = {
            ChildComponent: children
        };
        return super.render(renderProps);
    }
}

export default Composer;
