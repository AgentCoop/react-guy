import React from 'react';
import {fireEvent, render} from '@testing-library/react';

import {
    Composer,
    ElementGroup
} from '../index';

import * as eventType from '../eventType';

import Submit from "./Base/Submit";
import Email from "./Fields/Email";

it('should debounce 3 events and handle 1', async () => {
    const onSubmitDiscarded = jest.fn();
    const onInputDiscarded = jest.fn();

    const debounceSubmitSpec = {
        duration: 50,
        onDiscard: onSubmitDiscarded,
        filter: { type: eventType.FINALIZE }
    };

    const debounceInputSpec = {
        duration: 50,
        onDiscard: onInputDiscarded,
        filter: { type: eventType.VALUE_CHANGED }
    };

    const { getByText, getByLabelText } = render(
        <Composer
            initialValues={{}}
            onPropagationFinished={function(e) {
                const { type } = e;
                if (type === eventType.FINALIZE)
                    expect(onSubmitDiscarded).toHaveBeenCalledTimes(3);
                if (type === eventType.VALUE_CHANGED)
                    expect(onInputDiscarded).toHaveBeenCalledTimes(9);
            }}
        >
            <form>
                <ElementGroup
                    debounce={[debounceSubmitSpec, debounceInputSpec]}
                >
                    <Email />
                    <Submit />
                </ElementGroup>
            </form>
        </Composer>
    );

    for (let i = 0; i < 4; i++)
        fireEvent.click(getByText('Submit'));


    function changeEmail(value) {
        const inputEvent = { target: { value } };
        fireEvent.change(getByLabelText(/Email/i), inputEvent);
    }
    for (let i = 0; i < 10; i++)
        changeEmail('foo');

    await new Promise(function(resolve) {
        setTimeout(function() {
            changeEmail('bar');
            resolve();
        }, 150);
    });
});
