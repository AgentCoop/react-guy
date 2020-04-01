import React from 'react';
import { Composer } from '../../src';
import renderer from 'react-test-renderer';

test('Render composer', () => {
    const component = renderer.create(
        <Composer>Hello, World!</Composer>,
    );
    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});