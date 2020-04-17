import React from "react";

import Input from "../../../../composer-foundation/Input";

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
