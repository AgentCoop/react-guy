import React from 'react';

import {
    UIElement
} from '../../../composer/src';

import * as eventType from '../../../composer/src/eventType';

function prepend(inputProps, prependProps, elementProps) {
    const { label, ...rest } = prependProps;
    const { id } = inputProps;
    return(
        <label htmlFor={id} {...rest}>
            {label}
        </label>
    );
}

function append(inputProps, prependProps, elementProps) {
    return null;
}

export default function Input(props) {
    const {
        type,
        name,
        renderProps={},
        defaultValue="",
        onBlur,
        onFocus,
        onChange,
        clearErrorsOnFocus=true,
        ...rest
    } = props;

    let { id } = props;
    let inputRef = React.createRef();

    const {
        prependElement=prepend,
        prependProps={},
        appendElement=append,
        appendProps={}
    } = renderProps;

    if (!id)
        id = name;

    return (
        <UIElement
            getComponentRef={ref => (inputRef = ref)}
            defaultValue={defaultValue}
            name={name}
            {...rest}
        >
            {({ value, state, errors, dispatch }) => {
                const elementProps = { state, errors, value };
                const inputProps = { ...rest, type, name, id };
                const { disabled } = state;
                return (
                    <>
                        {prependElement(inputProps, prependProps, elementProps)}
                        <input
                            id={name}
                            type={type}
                            onBlur={function(e) {
                                const v = e.target.value;
                                if (inputRef.getInitialValue() !== v)
                                    dispatch(eventType.NEW_VALUE, v);
                                onBlur && onBlur(e);
                            }}
                            onFocus={function(e) {
                                if (Object.keys(errors).length && clearErrorsOnFocus)
                                    inputRef.reset();
                                onFocus && onFocus(e);
                            }}
                            onChange={function(e) {
                                const newValue = e.target.value;
                                dispatch(eventType.VALUE_CHANGED, newValue);
                                onChange && onChange(e);
                            }}
                            disabled={disabled}
                            value={value}
                        />
                        {appendElement(inputProps, appendProps, elementProps)}
                    </>
                );
            }}
        </UIElement>
    );
}
