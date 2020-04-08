import React from 'react';
import {fireEvent, render} from '@testing-library/react';

import {
    Composer,
    ElementGroup,
    AsyncHandler, EVENT_TYPE_FINALIZE
} from '../../src';

import {
    delay,
    EVENT_CHANGE_EMAIL_VALUE
} from './utils';

import Submit from './Base/Submit';
import Password from './Fields/Password';
import Email from './Fields/Email';

it('should validate email value using async handler', async () => {
    const asyncValid = jest.fn();
    const asyncValidStarted = jest.fn();
    const asyncValidFinished = jest.fn();

    const { getByText, getByLabelText } = render(
        <Composer
            initialValues={{ }}
            onPropagationStarted={function(e) {
                if (e.type == EVENT_TYPE_FINALIZE)
                    expect(asyncValid).toHaveBeenCalledTimes(0);
            }}
            onPropagationFinished={function(e) {
                if (e.type == EVENT_TYPE_FINALIZE)
                    expect(asyncValid).toHaveBeenCalledTimes(1);
            }}
        >
            <form>
                <ElementGroup>
                    <Email
                        required
                        onAsyncValidateStarted={asyncValidStarted}
                        onAsyncValidateFinished={asyncValidFinished}
                        validate={function(e) {
                            return new AsyncHandler(function(event, details, { resolve, reject }) {
                                setTimeout(function() {
                                    asyncValid();
                                    resolve();
                                }, 50);
                            });
                        }}
                    />
                </ElementGroup>

                <Submit />
            </form>
        </Composer>
    );

    fireEvent.change(getByLabelText(/Email/i), EVENT_CHANGE_EMAIL_VALUE);

    await delay(10);
    fireEvent.click(getByText('Submit'));

    await delay(60);
    expect(asyncValidStarted).toHaveBeenCalledTimes(1);
    expect(asyncValidFinished).toHaveBeenCalledTimes(1);
});
