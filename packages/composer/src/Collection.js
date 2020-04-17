import * as eventType from "./eventType";

class Collection {
    constructor(elements) {
        this.elements = elements;
    }

    flush = () => {
        this.elements = [];
    };

    count = () => {
        return this.elements.length;
    };

    setState = newState => {
        this.elements.forEach(el => {
            el._setState(newState);
        });
    };

    setValue = value => {
        this.elements.forEach(el => {
            const event = el.createEvent(eventType.NEW_VALUE, value);
            el.dispatch(event);
        });
    };
}

export default Collection;
