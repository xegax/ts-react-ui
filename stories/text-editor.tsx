import * as React from 'react';
import { storiesOf } from '@storybook/react';
import { TextView } from '../src/rte/text-view';
import { showEditor } from '../src/rte/show-editor';
import { TextEditorJSON } from '../src/rte/text-editor';
import { Subscriber, Publisher } from '../src/subscriber';

function renderEnt(type: string, data: any) {
  return <span>{type}</span>;
}

class TextData extends Publisher {
  private json: TextEditorJSON;

  set(json: TextEditorJSON) {
    this.json = json;
    this.delayedNotify();
  }

  get() {
    return this.json;
  }
}

const m = new TextData();

function edit() {
  showEditor({ json: m.get() })
  .then(json => {
    m.set(json);
  })
  .catch(() => {});
}

storiesOf('Text editor', module)
  .add('Text editor', () => (
    <Subscriber
      model = {m}
      render={() => {
        return (
          <div onDoubleClick={edit}>
            <TextView
              json={m.get()}
              renderEnt={renderEnt}
            />
          </div>
        );
      }}
    />
  ));
