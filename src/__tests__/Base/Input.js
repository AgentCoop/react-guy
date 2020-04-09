import React from 'react';

import {
    UIElement
} from '../..';

import * as eventType from '../../eventType';

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
                                dispatch(eventType.NEW_VALUE, e.target.value);
                            }}
                            onFocus={e => {
                                if (Object.keys(errors).length)
                                    inputRef.reset();
                            }}
                            onChange={e => {
                                const newValue = e.target.value;
                                dispatch(eventType.VALUE_CHANGED, newValue);
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
