import * as React from 'react';

import { storiesOf } from '@storybook/react';
import { prompt, confirm, Intent } from '../src/prompt';

let textValue = 'previous value';
storiesOf('prompts', module)
  .add('prompts', () => {
    return (
      <>
        <button onClick={() => {
          prompt({ title: 'enter text', value: textValue })
          .then(value => {
            textValue = value; 
          });
        }}>
          text prompt
        </button>
        <button onClick={() => {
          confirm({ text: 'Are you sure to delete?' })
          .then(() => console.log('delete'))
          .catch(() => {});
        }}
        >
          action
        </button>
      </>
    );
  });