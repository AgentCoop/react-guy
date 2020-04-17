import React from "react";

import { ParentNodeCtx, findNodesByAttrValue } from "./utils";
import {
    createEvent,
    dispatch
} from "./events";

import * as attr from './nodeAttr';
import Collection from "./Collection";
import {
    DISABLED_STATIC_LISTENERS
} from "./nodeAttr";

class AbstractNode extends React.Component {
    constructor(props) {
        super(props);
        const { nodeType } = props;
        this.$type = nodeType;

        // Unique integer ID, big enough to avoid possible collisions
        this[attr.ID] = parseInt(Math.random().toString().substr(2));
        this[attr.NAME] = props.name ? props.name : null;
        this[attr.CHILDS] = new Map();
        this[attr.PARENT] = null;
        this[attr.NEXT_SIBLING] = null;
        this[attr.PREV_SIBLING] = null;
        this[attr.REGISTERED_LISTENERS] = new Map();
        this[attr.DISABLED_STATIC_LISTENERS] = new Map();
        this[attr.CLASS] = props._class;

        this.createEvent = createEvent;
        this.dispatch = (event, async) => {
            return dispatch(this, event, async);
        };
        this.nodeContext = {};
        this.namespace =
            typeof props.namespace !== "undefined" ? props.namespace : null;
    }

    getId = () => {
        return this[attr.ID];
    };

    getType = () => {
        return this.$type;
    };

    getName = (fqn = false) => {
        if (!this[attr.NAME])
            return null;
        else
            return fqn
                ? this.getNamespace(true) + "." + this[attr.NAME]
                : this[attr.NAME];
    };

    addEventListener = (
        eventType,
        handler,
        options = { once: false, useCapture: false, overwrite: false }
    ) => {
        let registeredListeners;
        const { overwrite } = options;
        if (!this[attr.REGISTERED_LISTENERS].has(eventType) || overwrite)
            registeredListeners = [];
        else
            registeredListeners = this[attr.REGISTERED_LISTENERS].get(eventType);

        registeredListeners.push({ handler: handler.bind(this), options });
        this[attr.REGISTERED_LISTENERS].set(eventType, registeredListeners);

        if (overwrite)
            this[DISABLED_STATIC_LISTENERS].set(eventType, true);
    };

    removeEventListener = handler => {
        this[attr.REGISTERED_LISTENERS].forEach((listeners, eventType) => {
            listeners.forEach((listener, index) => {
                if (listener.handler === handler)
                    listeners.splice(index, 1);
            });
        });
    };

    isStaticListenerDisabled = (eventType) => {
        return this[attr.DISABLED_STATIC_LISTENERS].has(eventType);
    }

    getClass = () => {
        return this[attr.CLASS];
    };

    getEventListeners = eventType => {
        const listeners = this[attr.REGISTERED_LISTENERS].get(eventType);
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

    getNamespace = (fullyQualified = true) => {
        if (!fullyQualified)
            return this.namespace;

        const parts = this.getAncestorsPath()
            .reverse()
            .filter(p => p.getNamespace(false) !== null)
            .map(p => p.getNamespace(false));

        return parts.join(".");
    };

    addChildNode = child => {
        const childsMap = this[attr.CHILDS];

        if (childsMap.has(child.getId()))
            // Do not add the same node twice
            return;

        childsMap.set(child.getId(), child);
    };

    // Returns array of node's siblings
    getSiblings = () => {
        const results = [];

        let p = this;
        while ((p = p.getPrevSibling()))
            results.unshift(p);

        p = this;
        while ((p = p.getNextSibling()))
            results.push(p);

        return results;
    };

    getParentNode = () => {
        return this[attr.PARENT];
    };

    getRoot = () => {
        let p = this;
        while (p.getParentNode())
            p = p.getParentNode();

        return p;
    };

    getChildNodes = () => {
        return Array.from(this[attr.CHILDS].values());
    };

    getPrevSibling = () => {
        return this[attr.PREV_SIBLING];
    };

    getNextSibling = () => {
        return this[attr.NEXT_SIBLING];
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
        const nodes = findNodesByAttrValue(attr.CLASS, _class, this, except);
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
                    this[attr.PARENT] = parent;
                    this.nodeContext.parent = this;
                    if (this.getParentNode())
                        this.getParentNode().addChildNode(this);

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