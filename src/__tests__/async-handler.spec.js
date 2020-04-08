import React from 'react';
import {fireEvent, render} from '@testing-library/react';

import {
    AsyncHandler,
    Composer,
    ElementGroup
} from '../index';

import Submit from "./Base/Submit";

function incrementCounter(e) {
    const { target } = e;
    target.getRoot().counter++;
}

it('should propagate through all nodes 4 times', () => {
    const { getByText } = render(
        <Composer
            onPropagationStarted={e => e.target.getRoot().counter = 1}
            onPropagationFinished={function(e) {
                //expect(e.target.getRoot().counter).toBe(3);
            }}
            initialValues={{}}
            onFinalize={incrementCounter}
        >
            <form>
                <ElementGroup
                    onFinalize={function(event) {
                        const { target } = event;
                        return new AsyncHandler(function(event, details, { resolve, reject }) {
                            setTimeout(function() {
                                expect(target.getRoot().counter).toBe(2); // onPropagationStarted, Submit
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

    fireEvent.click(getByText('Submit'));
});
