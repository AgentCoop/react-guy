
export function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(function() {
            resolve(true);
        }, time);
    });
}

export const EVENT_CHANGE_EMAIL_VALUE = { target: { value: 'john.doe@gmail.com' } };
export const EVENT_CHANGE_INVALID_EMAIL_VALUE = { target: { value: 'foo' } };