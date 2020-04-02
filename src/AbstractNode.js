import React from "react";

import { ParentNodeCtx, findNodesByAttrValue } from "./utils";

import {
    createEvent,
    dispatch,
    dispatchSync,
    NODE_CHILDS_ATTR,
    NODE_ID_ATTR,
    NODE_NAME_ATTR,
    NODE_NEXT_SIBLING_ATTR,
    NODE_PARENT_NODE_ATTR,
    NODE_PREV_SIBLING_ATTR,
    NODE_REGISTERED_LISTENERS_ATTR
} from "./events";

import Collection from "./Collection";

const NODE_CLASS_ATTR = Symbol("node_class_attr");
const REGISTERED_LISTENERS_ATTR = Symbol("registered_listeners");

class AbstractNode extends React.Component {
    constructor(props) {
        super(props);
        const { nodeType } = props;
        this.$type = nodeType;

        // Unique integer ID, big enough to avoid possible collisions
        this[NODE_ID_ATTR] = parseInt(
            Math.random()
                .toString()
                .substr(2)
        );
        this[NODE_NAME_ATTR] = props.name ? props.name : null;
        this[NODE_CHILDS_ATTR] = new Map();
        this[NODE_PARENT_NODE_ATTR] = null;
        this[NODE_NEXT_SIBLING_ATTR] = null;
        this[NODE_PREV_SIBLING_ATTR] = null;
        this[NODE_REGISTERED_LISTENERS_ATTR] = new Map();
        this[NODE_CLASS_ATTR] = props._class;

        this.createEvent = createEvent;
        this.dispatch = (event, async) => {
            return dispatch(this, event, async);
        };
        this.nodeContext = {};
        this.namespace =
            typeof props.namespace !== "undefined" ? props.namespace : null;
    }

    addEventListener = (
        eventType,
        handler,
        options = { once: false, useCapture: false }
    ) => {
        let registeredListeners;
        if (!this[NODE_REGISTERED_LISTENERS_ATTR].has(eventType))
            registeredListeners = [];
        else
            registeredListeners = this[NODE_REGISTERED_LISTENERS_ATTR].get(eventType);
        registeredListeners.push({ handler: handler.bind(this), options });
        this[NODE_REGISTERED_LISTENERS_ATTR].set(eventType, registeredListeners);
    };

    removeEventListener = handler => {
        this[NODE_REGISTERED_LISTENERS_ATTR].forEach((listeners, eventType) => {
            listeners.forEach((listener, index) => {
                if (listener.handler === handler) listeners.splice(index, 1);
            });
        });
    };

    getClass = () => {
        return this[NODE_CLASS_ATTR];
    };

    getEventListeners = eventType => {
        const listeners = this[NODE_REGISTERED_LISTENERS_ATTR].get(eventType);
        return listeners ? listeners : [];
    };

    traverseTree = (root, cb) => {
        function traverse(parent) {
            let prevSibling, nextSibling;
            const childs = parent.getChildNodes(),
                len = childs.length;
            for (let i = 0; i < len; i++) {
                const current = childs[i];
                traverse(current);
                prevSibling = i ? childs[i - 1] : null;
                nextSibling = i < len - 1 ? childs[i + 1] : null;
                cb(parent, current, prevSibling, nextSibling);
            }
        }
        traverse(root);
    };

    getId = () => {
        return this[NODE_ID_ATTR];
    };

    getType = () => {
        return this.$type;
    };

    getName = (fqn = false) => {
        if (!this[NODE_NAME_ATTR]) return null;
        else
            return fqn
                ? this.getNamespace(true) + "." + this[NODE_NAME_ATTR]
                : this[NODE_NAME_ATTR];
    };

    getNamespace = (fullyQualified = true) => {
        if (!fullyQualified) return this.namespace;
        const parts = this.getAncestorsPath()
            .reverse()
            .filter(p => p.getNamespace(false) !== null)
            .map(p => p.getNamespace(false));
        return parts.join(".");
    };

    addChildNode = child => {
        const childsMap = this[NODE_CHILDS_ATTR];

        if (childsMap.has(child.getId()))
            // Do not add the same node twice
            return;

        childsMap.set(child.getId(), child);
    };

    // Returns array of node's siblings
    getSiblings = () => {
        const results = [];

        let p = this;
        while ((p = p.getPrevSibling())) results.unshift(p);

        p = this;
        while ((p = p.getNextSibling())) results.push(p);

        return results;
    };

    getParentNode = () => {
        return this[NODE_PARENT_NODE_ATTR];
    };

    getRoot = () => {
        let p = this;
        while (p.getParentNode()) p = p.getParentNode();

        return p;
    };

    getChildNodes = () => {
        return Array.from(this[NODE_CHILDS_ATTR].values());
    };

    getPrevSibling = () => {
        return this[NODE_PREV_SIBLING_ATTR];
    };

    getNextSibling = () => {
        return this[NODE_NEXT_SIBLING_ATTR];
    };

    findByElementName = (name, excludeNode = null) => {
        const results = [];
        function traverse(root) {
            //if (root === excludeNode)
            //    return;
            if (root.getName() === name) results.push(root);
            for (let child of root.getChildNodes()) {
                traverse(child);
                if (child.getName() === name && excludeNode !== child) {
                    results.push(child);
                }
            }
        }
        traverse(this);
        return new Collection(results);
    };

    findByClass = (_class, except = []) => {
        const nodes = findNodesByAttrValue(NODE_CLASS_ATTR, _class, this, except);
        return new Collection(nodes);
    };

    getAncestorsPath = (including = false) => {
        const ancestors = [];
        let p = this;
        if (including) {
            ancestors.push(this);
        }
        while ((p = p.getParentNode())) ancestors.push(p);
        return ancestors;
    };

    getDescendantsPath = (including = false) => {
        const ancestors = this.getAncestorsPath(including);
        const descendants = ancestors.reverse();
        return descendants;
    };

    render(renderProps) {
        const { ChildComponent, parentContext = {} } = renderProps;
        return (
            <ParentNodeCtx.Consumer>
                {({ parent, ...passThroughCtx }) => {
                    this[NODE_PARENT_NODE_ATTR] = parent;
                    this.nodeContext.parent = this;
                    if (this.getParentNode()) this.getParentNode().addChildNode(this);

                    for (let key of Object.keys(passThroughCtx)) {
                        this.nodeContext[key] = passThroughCtx[key];
                    }
                    // Overwrite
                    for (let key of Object.keys(parentContext)) {
                        if (typeof parentContext[key] === "undefined") continue;
                        this.nodeContext[key] = parentContext[key];
                    }

                    return (
                        <ParentNodeCtx.Provider value={this.nodeContext}>
                            {typeof ChildComponent === "function"
                                ? ChildComponent(this.props)
                                : ChildComponent}
                        </ParentNodeCtx.Provider>
                    );
                }}
            </ParentNodeCtx.Consumer>
        );
    }
}

AbstractNode.contextType = ParentNodeCtx;

export default AbstractNode;