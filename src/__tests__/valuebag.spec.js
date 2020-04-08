import React from 'react';
import {fireEvent, render} from '@testing-library/react';

import {
    Composer,
    ElementGroup,
    EVENT_TYPE_FINALIZE
} from '../../src';

import Submit from './Base/Submit';
import Password from './Fields/Password';
import Email from './Fields/Email';

it('should namespace email/password values into auth', async () => {
    const { getByText, getByLabelText } = render(
        <Composer
            onPropagationFinished={function(event) {
                if (event.type === EVENT_TYPE_FINALIZE)
                    expect(this.values).toEqual({ auth:
                       { email: 'john.doe@gmail.com',  password: "secret" }
                    });
            }}
            initialValues={{ auth: { email: 'john.doe@gmail.com' } }}
        >
            <form>
                <ElementGroup namespace={'auth'}>
                    <Email />
                    <Password />
                </ElementGroup>

                <Submit />
            </form>
        </Composer>
    );

    const inputEvent = { target: { value: 'secret' } };

    fireEvent.change(getByLabelText(/Password/i), inputEvent);
    fireEvent.blur(getByLabelText(/Password/i), inputEvent);
    setTimeout(function() {
        fireEvent.click(getByText('Submit'));
    }, 50);
});
