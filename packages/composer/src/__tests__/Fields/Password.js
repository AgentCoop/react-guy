import React from "react";

import { Input } from "../../../../composer-foundation/src";

export default function(props) {
    return (
        <Input
            {...props}
            name={"password"}
            renderProps={{
                prependProps: { label: "Password" }
            }}
            type={"password"}
        />
    );
}
