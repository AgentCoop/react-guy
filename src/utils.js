import React from "react";

export const ParentNodeCtx = React.createContext({ parent: null });

export function namespacedValue(valueBag, name, value, namespace) {
    if (typeof valueBag === "object") {
        return { [namespace]: { ...valueBag } };
    } else {
        return { [namespace]: { [name]: value } };
    }
}

export function patchDetailsValueBag(details, name, value, namespace) {
    const newValueBag = namespacedValue(details.valueBag, name, value, namespace);
    details.valueBag = newValueBag;
}
