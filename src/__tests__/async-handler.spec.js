import React from 'react';
import {fireEvent, render} from '@testing-library/react';

import {
    AsyncHandler,
    Composer,
    ElementGroup
} from '../index';

import {delay} from './utils';
import * as eventType from '../eventType';

import Submit from "./Base/Submit";

const TARGET_COUNT = 7;

function incrementCounter(e) {
    const { target } = e;
    if (typeof target.getRoot().counter === "undefined")
        target.getRoot().counter = 1;
    else
        target.getRoot().counter++;
}

it(`should propagate through all nodes ${TARGET_COUNT} times`, async () => {
    const { getByText } = render(
        <Composer
            onPropagationStarted={incrementCounter}
            onPropagationFinished={function(e) {
                incrementCounter(e);
                if (e.type === eventType.FINALIZE)
                    expect(e.target.getRoot().counter).toBe(TARGET_COUNT);
                else if (e.type === eventType.REGISTER)
                    expect(e.target.getRoot().counter).toBe(2);
            }}
            initialValues={{}}
            onFinalize={incrementCounter}
        >
            <form>
                <ElementGroup
                    onFinalize={function(event) {
                        return new AsyncHandler(function(event, details, { resolve, reject }) {
                            setTimeout(function() {
                                const { target } = event;
                                expect(target.getRoot().counter).toBe(4);
                                incrementCounter(event);
                                resolve(true);
                            }, 50);
                        });
                    }}
                    namespace={'qaz'}
                >
                    <Submit
                        onFinalize={incrementCounter}
                    />
                </ElementGroup>
            </form>
        </Composer>
    );

    await delay(100);

    fireEvent.click(getByText('Submit'));

    await delay(100);
});
