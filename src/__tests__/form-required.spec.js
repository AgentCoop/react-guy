import React from 'react';
import {fireEvent, render} from '@testing-library/react';

import {
    Composer,
    ElementGroup
} from '../../src';

import {
    delay,
    EVENT_CHANGE_EMAIL_VALUE
} from './utils';

import Submit from './Base/Submit';
import Password from './Fields/Password';
import Email from './Fields/Email';

it('should call onValidationFailed event handler', async () => {
    const onValidFailed = jest.fn();

    const { getByText, getByLabelText } = render(
        <Composer
            onPropagationFinished={function(event) {
            }}
            initialValues={{ }}
        >
            <form>
                <ElementGroup namespace={'reg'}>
                    <Email
                        required
                        onValidationFailed={function(e) {
                            onValidFailed();
                        }}
                    />
                    <Password
                        onValidationFailed={function(e) {
                            onValidFailed();
                        }}
                        required
                    />
                </ElementGroup>

                <Submit />
            </form>
        </Composer>
    );

    fireEvent.change(getByLabelText(/Email/i), EVENT_CHANGE_EMAIL_VALUE);

    await delay(10);
    fireEvent.click(getByText('Submit'));

    await delay(10);
    expect(onValidFailed).toHaveBeenCalledTimes(1);
});
