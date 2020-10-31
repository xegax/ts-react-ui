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
  'ENT-LINK': linkEditor(),
  'ENT-IMG': imageEditor()
};

const entRenderMap: Record<string, React.SFC<EntRenderProps> | React.ComponentClass<EntRenderProps>> = {
  'ENT-LINK': Link,
  'ENT-IMG': ImageToEdit
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
      .then(label => {
        return { label };
      })
    );
  };

  const editVar = (v: EntData) => {
    return (
      prompt({ title: 'Edit var name', value: v.label })
      .then(label => {
        return { label };
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
      <Subscriber model = {m}>
        {() => {
          return (
            <TextView
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
            />
        );
      }}
      </Subscriber>
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
