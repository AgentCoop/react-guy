import React from "react";

import Button from "./Button";
import * as eventType from '../../eventType';

export default function(props) {
    return (
        <Button
            {...props}
            type={eventType.FINALIZE}>
            Submit
        </Button>
    );
}