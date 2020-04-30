import React from 'react';
import { render } from '@testing-library/react';

import {
    Composer,
    ElementGroup
} from '../index';

import { EMAIL_VALUE } from './Fields/Email';
import {
    changeEmailField,
    delay
} from './utils';

import Submit, { submit } from './Base/Submit';
import Email from './Fields/Email';

it('should convert email field value to uppercase', async () => {
    const { getByText, getByLabelText } = render(
        <Composer
            initialValues={{ }}
            onFinalize={function(e) {
                const data = this.values;
                const email = data['email'];
                expect(email).toBe(String(EMAIL_VALUE).toUpperCase());
            }}
        >
            <form>
                <ElementGroup
                    onNewValue={function(e) {
                        e.payload = e.payload.toUpperCase();
                    }}
                >
                    <Email />
                </ElementGroup>

                <Submit />
            </form>
        </Composer>
    );

    await changeEmailField(getByLabelText, EMAIL_VALUE);
    await submit(getByText);
});
