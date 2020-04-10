import React from 'react';
import {render} from '@testing-library/react';

import {
    Composer,
    ElementGroup
} from '../index';

import Submit, { submit } from './Base/Submit';

it(`should stop event propagation`, async () => {
    const onFinalize = jest.fn();

    const { getByText } = render(
        <Composer
            onFinalize={onFinalize}
            initialValues={{}}
        >
            <form>
                <ElementGroup
                    onFinalize={function(e) {
                        e.stopBubbling();
                    }}
                >
                    <Submit />
                </ElementGroup>
            </form>
        </Composer>
    );

    await submit(getByText);
    expect(onFinalize).toHaveBeenCalledTimes(0);
});
