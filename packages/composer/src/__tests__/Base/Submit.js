import React from "react";
import {fireEvent} from '@testing-library/react';

import Button from "./Button";
import * as eventType from '../../eventType';
import {delay} from '../utils';

export async function submit(getByText) {
    await delay(10);
    fireEvent.click(getByText('Submit'));
    await delay(10);
}

export default function(props) {
    return (
        <Button
            {...props}
            type={eventType.FINALIZE}>
            Submit
        </Button>
    );
}
