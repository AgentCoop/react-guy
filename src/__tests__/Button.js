import React from 'react';

import { UIElement } from '../../src';

export default function Button(props) {
    const { type, children } = props;
    return (
        <UIElement>
            {({ value, state, dispatch }) => {
                return (
                    <button
                        type="button"
                        onClick={async e => {
                            dispatch(type, null);
                        }}
                        defaultValue={value}
                        disabled={false}
                    >
                        {children}
                    </button>
                );
            }}
        </UIElement>
    );
}
