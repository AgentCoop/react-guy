import React from "react";

import Button from "../Button";
import {
    EVENT_TYPE_FINALIZE
} from "../../events";

export default function() {
    return <Button type={EVENT_TYPE_FINALIZE}>Submit</Button>;
}