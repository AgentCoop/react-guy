import React from 'react';

import {
    UIElement,
    EVENT_TYPE_NEW_VALUE,
    EVENT_TYPE_VALUE_CHANGED
} from '../../src';

export default function Input(props) {
    const { label, type, name, ...rest } = props;
    let inputRef = React.createRef();
    return (
        <UIElement
            getComponentRef={ref => (inputRef = ref)}
            defaultValue={""}
            name={name}
            {...rest}
        >
            {({ value, state: { disabled }, errors, dispatch }) => {
                return (
                    <>
                        <label htmlFor={name}>{label}:</label>
                        <input
                            id={name}
                            type={type}
                            onBlur={e => {
                                console.log('blur', e.target.value, 'd');
                                dispatch(EVENT_TYPE_NEW_VALUE, e.target.value);
                            }}
                            onFocus={e => {
                                if (Object.keys(errors).length)
                                    inputRef.reset();
                            }}
                            onChange={e => {
                                const newValue = e.target.value;
                                dispatch(EVENT_TYPE_VALUE_CHANGED, newValue);
                            }}
                            disabled={disabled}
                            value={value}
                        />
                        {errors.validationErr ? (
                            <div>{errors.validationErr}</div>
                        ) : null}
                    </>
                );
            }}
        </UIElement>
    );
}
