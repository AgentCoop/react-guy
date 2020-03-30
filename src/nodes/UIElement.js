import React from "react";
import ReactDOM from "react-dom";
import invariant from "invariant";

import AbstractNode from "../AbstractNode";
import { ParentNodeCtx } from "../utils";

import { NODE_TYPE_UI_ELEMENT, EVENT_TYPE_REGISTER } from "../events";

const EL_PREV_VALUE = Symbol("el_prev_value");

class UIElement extends AbstractNode {
    constructor(props) {
        super(props);
        this.$type = NODE_TYPE_UI_ELEMENT;
        const { name, defaultValue, defaultState = {}, initialValues } = props;

        if (!this.isValueless()) {
            this.state.value =
                typeof initialValues[name] !== "undefined"
                    ? initialValues[name]
                    : defaultValue;
        } else {
            this.state.value = defaultValue;
            this[EL_PREV_VALUE] = null;
        }
        this.state.state = defaultState;
        this.state.errors = {};
    }

    state = {};

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        //console.log("UIElement should update");
        return true;
    }

    async componentDidMount() {
        await this.dispatchSync(this.createRegisterEvent());
    }

    createRegisterEvent = () => {
        const domNode = ReactDOM.findDOMNode(this);
        return this.createEvent(EVENT_TYPE_REGISTER, {
            domNode,
            value: this.state.value
        });
    };

    getValue = () => {
        return this.state.value;
    };

    setValue = (value, onUpdated) => {
        this[EL_PREV_VALUE] = this.state.value;
        this.setState({ value }, onUpdated);
    };

    getPrevValue = () => {
        return this[EL_PREV_VALUE];
    };

    getState = () => {
        return this.state.state;
    };

    _setState = (newStatePart, onUpdated) => {
        const newState = { ...this.state.state, ...newStatePart };
        this.setState({ state: newState }, onUpdated);
    };

    clearState = () => {
        this.setState({ state: {} });
    };

    resetState = () => {
        const { defaultState = {} } = this.props;
        this.setState({ state: defaultState });
    };

    getErrors = () => {
        return this.state.errors;
    };

    setError = error => {
        this.setState({ errors: { ...this.getErrors(), ...error } });
    };

    clearErrors = () => {
        this.setState({ errors: {} });
    };

    reset = () => {
        const { defaultValue } = this.props;
        this.setValue(defaultValue);
        this.resetState();
        this.clearErrors();
    };

    isValueless = () => {
        const { name, defaultValue } = this.props;
        return (
            defaultValue === undefined || typeof name !== "string" || !name.length
        );
    };

    onReset = e => {
        console.log("reset");
    };

    render() {
        const { children } = this.props;
        const { value, state, errors } = this.state;
        const elementProps = {
            value,
            state,
            errors,
            dispatch: (type, payload) => {
                const event = this.createEvent(type, payload);
                return this.dispatch(event);
            },
            dispatchSync: (type, payload) => {
                const event = this.createEvent(type, payload);
                return this.dispatchSync(event);
            }
        };

        const renderProps = { ChildComponent: children(elementProps) };

        return super.render(renderProps);
    }
}

export default function(props) {
    const { getComponentRef, ...rest } = props;
    return (
        <ParentNodeCtx.Consumer>
            {({ initialValues, renderElementWrapper }) => {
                const ElementComponent = (
                    <UIElement
                        ref={ref => getComponentRef && getComponentRef(ref)}
                        {...rest}
                        initialValues={initialValues}
                    />
                );
                if (renderElementWrapper)
                    return renderElementWrapper({
                        children: ElementComponent,
                        name: props.name
                    });
                else return ElementComponent;
            }}
        </ParentNodeCtx.Consumer>
    );
}
