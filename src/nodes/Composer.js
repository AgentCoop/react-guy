import React from "react";
import invariant from "invariant";

import AbstractNode from "../AbstractNode";
import {
    NODE_TYPE_COMPOSER,
    NODE_PREV_SIBLING_ATTR,
    NODE_NEXT_SIBLING_ATTR,
    EVENT_TYPE_FINALIZE,
    valueRequired,
    isEmpty
} from "../events";

function onFinalizeEvent(event) {
    // Validate form data
    this.traverseValuesTree(function(value, fqn) {
        const el = this.getElementByName(fqn);
        if (valueRequired(el) && isEmpty(el)) {
            el.setError({ required: "Required value" });
            event.stopBubbling();
        }
    });
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
            once: false
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
                    cb.call(this, root[key], fqn);
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
