import * as React from 'react';
import { storiesOf } from '@storybook/react';
import { TextEditor, TextEditorModel } from '../src/rte/text-editor';
import { Subscriber } from '../src/subscriber';

let m = new TextEditorModel();

storiesOf('Text editor', module)
  .add('Text editor', () => {
    return (
      <Subscriber
        model={m}
        render={() => {
          return (
            <div>
              <TextEditor
                model={m}
              />
              <div>
                {JSON.stringify(m.getJSON(), null, ' ')}
              </div>
            </div>
          );
        }}
      />
    );
  });
