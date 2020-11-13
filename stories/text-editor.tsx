import * as React from 'react';
import { storiesOf } from '@storybook/react';
import { TextView } from '../src/rte/text-view';
import { showEditor } from '../src/rte/show-editor';
import { TextEditorJSON } from '../src/rte/text-editor';
import { Subscriber, Publisher } from '../src/subscriber';
import { showTemplateEditor } from '../src/rte/template-editor';
import { getTextFromTemplate, TextTemplate } from '../src/common/text-template';
import { prompt } from '../src/prompt';
import { EntData, EntEditor, EntRenderProps } from '../src/rte/helpers';
import { linkEditor, Link } from '../src/rte/ent-link';
import { imageEditor, ImageToEdit } from '../src/rte/ent-image';

const entEditorMap: Record<string, EntEditor> = {
  'LINK': linkEditor(),
  'IMAGE': imageEditor()
};

const entRenderMap: Record<string, React.SFC<EntRenderProps> | React.ComponentClass<EntRenderProps>> = {
  'LINK': Link,
  'IMAGE': ImageToEdit
};

function renderEnt(type: string, data: any) {
  return <span>{type}</span>;
}

class PubData<T> extends Publisher {
  private data: T;

  constructor(data: T) {
    super();

    this.data = data;
  }

  set(data: T) {
    this.data = data;
    this.delayedNotify();
  }

  get() {
    return this.data;
  }
}

class EntEditorPub extends PubData<TextEditorJSON> {
  private entKey?: string;
  private key = 0;

  selectEnt(entKey?: string) {
    if (entKey == this.entKey)
      return;

    this.entKey = entKey;
    this.key++;
    this.delayedNotify();
  }

  getSelectEnt() {
    return this.entKey;
  }

  getKey() {
    return this.key;
  }
}

function edit(m: PubData<TextEditorJSON>) {
  showEditor({ json: m.get(), entEditorMap })
  .then(json => {
    m.set(json);
  })
  .catch(() => {});
}

function editTemplate(m: PubData<TextTemplate>) {
  const appendVar = () => {
    return (
      prompt({ title: 'Enter var name' })
      .then(text => {
        return { text, data: {} };
      })
    );
  };

  const editVar = (data: EntData, text: string) => {
    return (
      prompt({ title: 'Edit var name', value: text })
      .then(text => {
        return { text, data };
      })
    );
  };

  showTemplateEditor({ template: m.get(), appendVar, editVar })
  .then(tt => {
    m.set(tt);
  })
  .catch(() => {});
}

storiesOf('Text editor', module)
  .add('Text editor', () => {
    const m = new EntEditorPub(null);
    return (
      <div style={{ backgroundColor: 'silver', padding: 10 }}>
      <Subscriber model = {m}>
        {() => (
          <TextView
            style={{ width: 500, backgroundColor: 'white', padding: 10 }}
            editorKey={m.getKey()}
            entRenderMap={entRenderMap}
            onDoubleClick={() => edit(m)}
            placeholder='Double click on me'
            json={m.get()}
            renderEnt={renderEnt}
            onChanged={json => {
              console.log(json);
              m.set(json);
            }}
            /*onClickEnt={(type, data, e) => {
              if (type == 'LINK') {
                window.open(data.href, 'link');
                e.preventDefault();
              }
            }}*/
          />
        )}
      </Subscriber>
      </div>
    );
  })
  .add('Template editor', () => {
    const m = new PubData<TextTemplate>([]);
    return (
      <Subscriber model = {m}>
        {() => {
          const text = getTextFromTemplate({ template: m.get(), getVar: ent => ent.label }) || '?';
          return (
            <div onDoubleClick={() => editTemplate(m)}>
              {text}
            </div>
          );
        }}
      </Subscriber>
    );
  });
