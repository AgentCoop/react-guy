import React from 'react';
import { render } from '@testing-library/react';

import {
    Composer,
    COMPOSER_TYPE,
    UI_ELEMENT_GROUP_TYPE,
    UI_ELEMENT_TYPE,
    ElementGroup
} from '../index';

import Submit from './Base/Submit';
import Email from './Fields/Email';

it('should build a component tree of four nodes', async () => {
    const { getByText, getByLabelText } = render(
        <Composer initialValues={{}}>
            <form>
                <ElementGroup>
                    <Email
                        onRegister={function() {
                            expect(this.getType()).toBe(UI_ELEMENT_TYPE);
                            expect(this.getParentNode().getType()).toBe(UI_ELEMENT_GROUP_TYPE);
                            expect(this.getParentNode().getParentNode().getType()).toBe(COMPOSER_TYPE);
                        }}
                    />
                </ElementGroup>

                <Submit
                    onRegister={function() {
                        expect(this.getType()).toBe(UI_ELEMENT_TYPE);
                        expect(this.getParentNode().getType()).toBe(COMPOSER_TYPE);
                    }}
                />
            </form>
        </Composer>
    );
});
