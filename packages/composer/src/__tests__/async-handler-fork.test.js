import React from 'react';
import { render } from '@testing-library/react';

import {
    Composer,
    ElementGroup
} from '../index';

import AsyncHandler from "../AsyncHandler";

import Submit, { submit } from './Base/Submit';
import Email, { setNewValue } from './Fields/Email';
import { EVENT_CHANGE_EMAIL_VALUE } from './utils';

let forkCallTime, finalizeCallTime;

it(`should fork execution of async event handler`, async () => {
    const onFinalize = jest.fn();
    const forkedHandler = jest.fn();
    const forkedFailed = jest.fn();
    const forkedFinished = jest.fn();

    const { getByText, getByLabelText } = render(
        <Composer
            onFinalize={function(e) {
                onFinalize();
                finalizeCallTime = Date.now();
            }}
            initialValues={{}}
        >
            <form>
                <ElementGroup
                    onForkFinished={forkedFinished}
                    onForkFailed={forkedFailed}
                    onFinalize={function(e) {
                        return new AsyncHandler(function(event, details, { resolve, reject }) {
                            forkCallTime = Date.now();
                            if (!forkedHandler.mock.calls.length)
                                resolve();
                            else
                                reject();
                            forkedHandler();
                        }, 10);
                    }}
                >
                    <Email
                    />
                    <Submit />
                </ElementGroup>
            </form>
        </Composer>
    );

    await setNewValue(getByLabelText, EVENT_CHANGE_EMAIL_VALUE);

    await submit(getByText);
    expect(forkCallTime).toBeGreaterThan(finalizeCallTime);

    await submit(getByText);
    expect(forkCallTime).toBeGreaterThan(finalizeCallTime);

    expect(onFinalize).toHaveBeenCalledTimes(2);
    expect(forkedHandler).toHaveBeenCalledTimes(2);
    expect(forkedFailed).toHaveBeenCalledTimes(1);
    expect(forkedFinished).toHaveBeenCalledTimes(1);
});
