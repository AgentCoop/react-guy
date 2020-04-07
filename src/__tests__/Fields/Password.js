import React from "react";

import Input from '../Base/Input';

export default function(props) {
    return (
        <Input
            {...props}
            name={"password"}
            label={"Password"}
            type={"password"}
        />
    );
}