import { EVENT_TYPE_NEW_VALUE } from "./events";

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
            const event = el.createEvent(EVENT_TYPE_NEW_VALUE, value);
            el.dispatch(event);
        });
    };
}

export default Collection;
