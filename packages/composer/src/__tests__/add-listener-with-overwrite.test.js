import React from 'react';
import { render } from '@testing-library/react';

import {
    Composer,
    ElementGroup
} from '../index';

import * as eventType from '../eventType';
import Submit, { submit } from './Base/Submit';

const onFinalize = jest.fn();

function addOnFinalize(ref) {
    if (!ref)
        return;
    ref.addEventListener(eventType.FINALIZE, onFinalize, { once: true,  overwrite: true });
}

it(`should call onFinalize once`, async () => {
    const { getByText } = render(
        <Composer
            ref={addOnFinalize}
            onFinalize={onFinalize}
            initialValues={{}}
        >
            <form>
                <ElementGroup>
                    <Submit />
                </ElementGroup>
            </form>
        </Composer>
    );

    for (let i = 0; i < 2; i++) {
        await submit(getByText);
    }

    expect(onFinalize).toHaveBeenCalledTimes(1);
});
