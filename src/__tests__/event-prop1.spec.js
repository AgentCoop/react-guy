import React from 'react';
import {fireEvent, render} from '@testing-library/react';

import {
    Composer,
    ElementGroup
} from '../index';

import * as eventType from '../eventType';
import Submit from './Base/Submit';
import Email from './Fields/Email';

const TARGET_COUNT = 4;

function increment(event) {
    event.payload++;
}

function addCaptureEvent(ref) {
    if (!ref)
        return;
    else
        return ref.addEventListener(eventType.FINALIZE, (e) => increment(e), { useCapture: true });
}

it(`should propagate through all nodes ${TARGET_COUNT} times`, () => {
    const { getByText } = render(
        <Composer
            ref={addCaptureEvent}
            onPropagationStarted={function(event) {
                if (event.type === eventType.FINALIZE)
                    event.payload = 0;
            }}
            onPropagationFinished={function(event) {
                if (event.type === eventType.FINALIZE)
                    expect(event.payload).toBe(TARGET_COUNT);
            }}
            initialValues={{}}
            onFinalize={increment}
        >
            <form>
                <ElementGroup
                    ref={addCaptureEvent}
                    onFinalize={increment}
                    namespace={'qaz'}
                >
                    <Email getComponentRef={addCaptureEvent} />
                    <Submit getComponentRef={addCaptureEvent} />
                </ElementGroup>
            </form>
        </Composer>
    );

    fireEvent.click(getByText('Submit'));
});
