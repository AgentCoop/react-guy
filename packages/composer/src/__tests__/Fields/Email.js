import React from "react";
import {fireEvent} from '@testing-library/react';

import {Input} from "../../../../composer-foundation/src";
import {delay} from '../utils';

export const EMAIL_VALUE = 'john.doe@gmail.com';
export const EmailRegExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i;

export async function setNewValue(getByLabelText, event) {
    await delay(10);
    const node = getByLabelText(/Email/i);
    fireEvent.change(node, event);

    await delay(10);
    fireEvent.blur(node);
    await delay(10);

    return true;
}

export default function Login(props) {
    return (
        <Input
            validate={value => {
                if (!EmailRegExp.test(value))
                    return "Invalid email address";
                else
                    return true;
            }}
            renderProps={{
                prependProps: { label: "Email" }
            }}
            name={"email"}
            type={"text"}
            {...props}
        />
    );
}
