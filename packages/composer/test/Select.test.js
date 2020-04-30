import * as React from 'react';
import { expect } from 'chai';
import { useFakeTimers } from 'sinon';
import {
  act,
  buildQueries,
  cleanup,
  createEvent,
  fireEvent,
  queries,
  render as testingLibraryRender,
} from '@testing-library/react/pure';

import {
  Composer,
  ElementGroup
} from '../src';

import * as eventType from '../src/eventType';
import {EMAIL_VALUE} from './Fields/Email';
import {
  delay,
  EVENT_CHANGE_EMAIL_VALUE
} from './utils';

import Submit, { submit } from './Base/Submit';
import Email from './Fields/Email';
import {render} from "@testing-library/react";

describe('<Select> integration', () => {
  // StrictModeViolation: uses Fade
  //const render = createClientRender({ strict: false });

  describe('with label', async () => {
    it('is displayed as focused while open', async () => {
      const { getByText, getByLabelText } = render(
          <Composer
              initialValues={{ }}
              onFinalize={function(e) {
                const data = this.values;
                const email = data['email'];
                console.log(this.values)
                expect(0).toBe(1);
                expect(email).toBe(String(EMAIL_VALUE).toUpperCase());
              }}
          >
            <form>
              <ElementGroup
                  onRegister={function() {
                    console.log('onRegister')
                  }}
                  onValueChanged={function(e) {
                    console.log('Val')
                    //e.payload = e.payload.toUpperCase();
                  }}
              >
                <Email
                    onValueChanged={function(e) {
                      console.log(e.target.getValue(), 'vakue')
                    }}
                    validate2={function() {
                      console.log('validate')
                    }} />

                <label htmlFor={"foo"}>foo</label>
                <input id="foo" type={"text"} name={"foo"} onChange={function() {
                  console.log('onChange')
                }}/>
              </ElementGroup>

              <Submit />
            </form>
          </Composer>
      );

      await delay(100);
      ///console.log(getByLabelText(/Email/i))
      fireEvent.change(getByLabelText(/foo/i), EVENT_CHANGE_EMAIL_VALUE);

      await delay(100);
      await submit(getByText);

     // const trigger = getByRole('button');
      //trigger.focus();
      //fireEvent.keyDown(document.activeElement, { key: 'Enter' });
      //expect(1).to(1)
    });
  });
});
