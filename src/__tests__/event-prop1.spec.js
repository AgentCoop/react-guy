import React from 'react';
import {fireEvent, render} from '@testing-library/react';

import {
    Composer,
    ElementGroup,
    EVENT_TYPE_FINALIZE
} from '../index';

import Submit from './Base/Submit';
import Email from './Fields/Email';

function increment(event) {
    event.payload++;
}

function addCaptureEvent(ref) {
    if (!ref)
        return;
    else
        return ref.addEventListener(EVENT_TYPE_FINALIZE, (e) => increment(e), { useCapture: true });
}

it('should propagate through all nodes 4 times', () => {
    const { getByText } = render(
        <Composer
            ref={addCaptureEvent}
            onPropagationStarted={function(event) {
                if (event.type === EVENT_TYPE_FINALIZE)
                    event.payload = 0;
            }}
            onPropagationFinished={function(event) {
                if (event.type === EVENT_TYPE_FINALIZE)
                    expect(event.payload).toBe(4);
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
