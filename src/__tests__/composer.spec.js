import React from 'react';
import {fireEvent, render} from '@testing-library/react';

import {
    Composer,
    ElementGroup,
    EVENT_TYPE_FINALIZE
} from '../../src';

import Input from './Input';
import Button from './Button';

function Email() {
    return (
        <Input
            required
            onNewValue={function(event) {

            }}
            onValueChanged={function(event) {
                ///console.log(event.)
            }}
            name={"email"}
            label={"Email"}
            type={"text"}
        />
    );
}

function Password() {
    return (
        <Input
            required
            onNewValue={function(event) {
                const { payload } = event;
            }}
            onValueChanged={function(event) {
                ///console.log(event.)
            }}
            name={"password"}
            label={"Password"}
            type={"password"}
        />
    );
}

function Submit() {
    return <Button type={EVENT_TYPE_FINALIZE}>Submit</Button>;
}

it('CheckboxWithLabel changes the text after click', async () => {
    const { getByText, getByLabelText, asFragment } = render(
        <Composer
            onPropagationStarted={function() {
                return 1;
                return function(event, details, { resove, reject }) {
                    setTimeout(function() {
                        resolve(1);
                        console.log('resolved')
                    }, 250);
                }
            }}
            onPropagationFinished={function(event) {
                if (event.type === EVENT_TYPE_FINALIZE)
                    expect(this.values).toEqual({ auth:
                       { email: 'john.doe@gmail.com',  password: "secret" }
                    });
            }}
            onFinalize={(event) => {
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

    const firstRender = asFragment();
    const inputEvent = { target: { value: 'secret' } };
    fireEvent.change(getByLabelText(/Password/i), inputEvent);
    fireEvent.blur(getByLabelText(/Password/i), inputEvent);
    fireEvent.click(getByText('Submit'));
});
