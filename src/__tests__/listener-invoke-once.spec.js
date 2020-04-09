import React from 'react';
import {fireEvent, render} from '@testing-library/react';

import {
    Composer,
    ElementGroup
} from '../index';

import * as eventType from '../eventType';
import Submit from './Base/Submit';
import Email from './Fields/Email';
import {delay, EVENT_CHANGE_EMAIL_VALUE} from './utils'

const onFinalize = jest.fn();
const onValueChanged = jest.fn();

function addOnFinalize(ref) {
    if (!ref)
        return;
    ref.addEventListener(eventType.FINALIZE, onFinalize, { useCapture: true, once: true });
}

function addOnChange(ref) {
    if (!ref)
        return;
    ref.addEventListener(eventType.VALUE_CHANGED, onValueChanged, { once: true });
}

it(`should call onFinalize twice and onValueChanged once`, async () => {
    const { getByLabelText, getByText } = render(
        <Composer
            ref={addOnFinalize}
            onFinalize={onFinalize}
            initialValues={{}}
        >
            <form>
                <ElementGroup
                    ref={addOnChange}
                >
                    <Email />
                    <Submit />
                </ElementGroup>
            </form>
        </Composer>
    );

    for (let i = 0; i < 2; i++) {
        fireEvent.change(getByLabelText(/Email/i), EVENT_CHANGE_EMAIL_VALUE);
        await delay(10);
        fireEvent.click(getByText('Submit'));
        await delay(10);
    }

    expect(onFinalize).toHaveBeenCalledTimes(3);
    expect(onValueChanged).toHaveBeenCalledTimes(1);
});
