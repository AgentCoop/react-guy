import React from "react";
import invariant from "invariant";

import AbstractNode from "../AbstractNode";
import {
    NODE_TYPE_COMPOSER,
    NODE_PREV_SIBLING_ATTR,
    NODE_NEXT_SIBLING_ATTR,
    EVENT_TYPE_FINALIZE,
    valueRequired,
    isEmpty,
    runCustomValidator,
    invokeEventHandlerByName,
    EVENT_HANDLER_ON_ASYNC_VALIDATE_STARTED,
    EVENT_HANDLER_ON_ASYNC_VALIDATE_FINISHED,
    EVENT_ATTR_RESOLVE_CB,
    EVENT_TYPE_VALUE_CHANGED
} from "../events";

function onValueChanged(event, details) {
    const { target, payload } = event;
    target.setValue(payload, function() {
        if (event[EVENT_ATTR_RESOLVE_CB]) event[EVENT_ATTR_RESOLVE_CB]();
    });
}

async function onFinalizeEvent(event, details, asyncCallbacks) {
    // Validate form data
    const promises = [];
    const asyncValidatorNodes = [];
    let validFailed = false;
    this.traverseValuesTree(function(value, fqn) {
        const node = this.getElementByName(fqn);
        if (valueRequired(node) && isEmpty(node)) {
            node.setError({ validationErr: "required value" });
            validFailed = true;
        } else if (node.props.validate) {
            const value = node.getValue();
            const asyncOrValue = node.props.validate(value);
            if (typeof asyncOrValue === "function") {
                asyncValidatorNodes.push(node);
                promises.push(runCustomValidator(asyncOrValue, node, event));
            } else if (asyncOrValue !== true)
                node.setError({ validationErr: asyncOrValue });
        }
    });

    if (validFailed) return;

    const { resolve, reject } = asyncCallbacks;
    try {
        // onAsyncValidateStarted
        asyncValidatorNodes.push(this);
        asyncValidatorNodes.forEach(node => {
            invokeEventHandlerByName(
                node,
                EVENT_HANDLER_ON_ASYNC_VALIDATE_STARTED,
                event,
                details
            );
        });
        const results = await Promise.all(promises);
        results.forEach(({ result, node }) => {
            if (result === true) return;
            node.setError({ validationErr: result });
        });
        resolve();
    } catch (e) {
        const { node, result } = e;
        node.setError({ validationErr: result });
        reject();
    } finally {
        // onAsyncVaidatorFinished
        asyncValidatorNodes.forEach(node => {
            invokeEventHandlerByName(
                node,
                EVENT_HANDLER_ON_ASYNC_VALIDATE_FINISHED,
                event,
                details
            );
        });
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

        this.addEventListener(EVENT_TYPE_FINALIZE, onFinalizeEvent, {
            useCapture: true,
            sync: true
        });
        this.addEventListener(EVENT_TYPE_VALUE_CHANGED, onValueChanged, {
            useCapture: true
        });
    }

    componentDidMount() {
        // Link component tree nodes once it was rendered
        this.traverseTree(this, function(
            parent,
            current,
            prevSibling,
            nextSibling
        ) {
            current[NODE_PREV_SIBLING_ATTR] = prevSibling;
            current[NODE_NEXT_SIBLING_ATTR] = nextSibling;
        });
    }

    registerElement = el => {
        const fqn = el.getName(true);
        console.log(fqn);
        if (!fqn) return;
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
                        console.log("reject");
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
