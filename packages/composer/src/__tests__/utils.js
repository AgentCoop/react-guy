import {EMAIL_VALUE} from './Fields/Email';
import {fireEvent} from "@testing-library/react";

export function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(function() {
            resolve(true);
        }, time);
    });
}

export async function changeEmailField(getByLabelText, value) {
    const input = getByLabelText(/email/i);

    fireEvent.focus(input);
    await delay(50);

    fireEvent.change(input, { target: { value } })
    await delay(50);

    fireEvent.blur(input);
    await delay(50);
}

export const EVENT_CHANGE_EMAIL_VALUE = { target: { value: EMAIL_VALUE } };
export const EVENT_CHANGE_INVALID_EMAIL_VALUE = { target: { value: 'foo' } };
