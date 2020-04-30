import React from "react";

import AbstractNode from "../AbstractNode";
import {
    ParentNodeCtx,
    namespacedValue
} from "../utils";

import * as nodeAttr from '../nodeAttr';

export const TYPE = Symbol('ui_element_group');

class ElementGroup extends AbstractNode {
    constructor(props) {
        super(props);
        this[nodeAttr.TYPE] = TYPE;
    }

    patchValueBag = (event, details, value) => {
        const { target, currentNode } = event;
        const ns = currentNode.getNamespace(false);
        // Pass through value bag intact if the group does not specify any namespace
        if (!ns) return;

        details.valueBag = namespacedValue(
            details.valueBag,
            target.getName(),
            value,
            ns
        );
    };

    onNewValue = (event, details) => {
        const { onNewValue } = this.props;
        this.patchValueBag(event, details, event.payload);
        if (onNewValue)
            return onNewValue(event, details);
    };

    onRegister = (event, details) => {
        const { target } = event;
        const { onRegister } = this.props;
        if (!target.isValueless()) {
            this.patchValueBag(event, details, event.payload.value);
        }
        if (onRegister) return onRegister(event, details);
    };

    render() {
        const { children, namespace, renderElementWrapper, ...rest } = this.props;
        const renderProps = {
            ChildComponent: children,
            parentContext: { renderElementWrapper, namespace },
            ...rest
        };
        if (namespace && namespace.length) {
            const { initialValues } = this.context;
            const nsInitialValues =
                typeof initialValues[namespace] !== "undefined"
                    ? initialValues[namespace]
                    : {};
            renderProps.parentContext.initialValues = nsInitialValues;
        }

        return super.render(renderProps);
    }
}

ElementGroup.contextType = ParentNodeCtx;

export default ElementGroup;
