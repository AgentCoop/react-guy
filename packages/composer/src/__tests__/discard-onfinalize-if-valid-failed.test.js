import React from 'react';
import {fireEvent, render} from '@testing-library/react';

import {
    Composer,
    ElementGroup
} from '../index';

import AsyncHandler from "../AsyncHandler";

import {
    delay,
    EVENT_CHANGE_EMAIL_VALUE,
    EVENT_CHANGE_INVALID_EMAIL_VALUE
} from './utils';

import Submit, { submit } from './Base/Submit';
import Email, {EmailRegExp, setNewValue} from './Fields/Email';

it('should not call onFinalize if validation failed', async () => {
    const onFinalize = jest.fn();
    const onAsyncValidFailed = jest.fn();
    const onValidFailed = jest.fn();
    const { getByText, getByLabelText } = render(
        <Composer
            onPropagationFinished={function(event) {
            }}
            initialValues={{ }}
            onFinalize={onFinalize}
        >
            <form>
                <ElementGroup>
                    <Email
                        defaultValue={""}
                        required
                        onValidationFailed={onValidFailed}
                        onAsyncValidationFailed={onAsyncValidFailed}
                        validate={function(e) {
                            const email = this.getValue();
                            return new AsyncHandler(function(event, details, { resolve, reject }) {
                                setTimeout(function() {
                                    if (EmailRegExp.test(email)) {
                                        resolve();
                                    } else {
                                        reject();
                                    }
                                }, 10);
                            });
                        }}
                    />
                </ElementGroup>

                <Submit />
            </form>
        </Composer>
    );

    async function submit() {
        fireEvent.click(getByText('Submit'));
        await delay(15);
    }

    await delay(10);

    await submit();
    expect(onFinalize).toHaveBeenCalledTimes(0);

    await setNewValue(getByLabelText, EVENT_CHANGE_INVALID_EMAIL_VALUE);
    await submit();
    expect(onFinalize).toHaveBeenCalledTimes(0);

    await setNewValue(getByLabelText, EVENT_CHANGE_EMAIL_VALUE);
    await submit();
    expect(onFinalize).toHaveBeenCalledTimes(1);
    expect(onAsyncValidFailed).toHaveBeenCalledTimes(1);
    expect(onValidFailed).toHaveBeenCalledTimes(1);
});
