import React from "react";

import Input from "../Base/Input";

export default function Login(props) {
    return (
        <Input
            validate={value => {
                const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                if (re.test(value))
                    return "Invalid email address";
            }}
            name={"email"}
            label={"Email"}
            type={"text"}
            {...props}
        />
    );
}