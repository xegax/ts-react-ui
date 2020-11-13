import * as React from 'react';
import { TextTemplate } from '../common/text-template';
import { RawDraftContentBlock, RawDraftContentState, RawDraftEntityRange } from 'draft-js';
import { clone } from '../common/common';
import { EntData } from './helpers';
import { showModal } from '../show-modal';
import {
  Dialog,
  Button,
  Intent,
  Classes as cs
} from '@blueprintjs/core';
import { TextEditor, TextEditorModel } from './text-editor';
import { CSSIcon } from '../cssicon';
import { Subscriber } from '../subscriber';

export function convertToDraft(tt: TextTemplate): RawDraftContentState {
  const raw: RawDraftContentState = {
    blocks: [],
    entityMap: {}
  };

  if (!tt.length)
    return raw;

  let entCntr = 0;
  const b: RawDraftContentBlock = {
    key: Math.random().toString(16).substr(2),
    type: 'unstyled',
    text: '',
    depth: 0,
    inlineStyleRanges: [],
    entityRanges: []
  };

  tt.forEach(t => {
    let text = '';
    if (typeof t == 'string') {
      text = t;
    } else {
      text = t.label || t.key || '?';
      
      b.entityRanges.push({
        offset: b.text.length,
        length: text.length,
        key: entCntr
      });

      raw.entityMap[entCntr++] = {
        type: 'VAR',
        mutability: 'IMMUTABLE',
        data: {
          label: text,
          key: t.key,
          data: {...t.data}
        }
      };
    }
    b.text += text;
  });

  raw.blocks = [b];
  return raw;
}

export function convertFromDraft(raw: RawDraftContentState): TextTemplate {
  let tt: TextTemplate = [];
  const block = raw.blocks[0];
  if (block && block.text) {
    if (block.entityRanges.length == 0)
      return [ block.text ];

    const entArr = clone(block.entityRanges);
    entArr.sort((a, b) => b.offset - a.offset);
    let ent: RawDraftEntityRange | undefined;

    let prev = 0;
    while (ent = entArr.pop()) {
      let str = block.text.substr(prev, ent.offset - prev);
      if (str.length)
        tt.push(str);

      const edata = raw.entityMap[ent.key].data as EntData;
      tt.push({
        label: edata.label || edata.key,
        key: edata.key,
        data: edata.data
      });

      prev = ent.offset + ent.length;
    }

    let str = block.text.substr(prev);
    if (str.length)
      tt.push(str);
  }

  return tt;
}

function appendVar(): Promise<EntData> {
  return Promise.resolve(null);
}

interface TemplateEditorArgs {
  template: TextTemplate;
  appendVar(): Promise<{ data: EntData; text: string }>;
  editVar(ent: EntData, text: string): Promise<{ data: EntData; text: string }>;
}

export function showTemplateEditor(args: TemplateEditorArgs): Promise<TextTemplate> {
  const m = TextEditorModel.create({
    content: convertToDraft(args.template),
    styles: {}
  });

  const append = () => {
    args.appendVar()
    .then(res => {
      m.insertEnt('VAR', res.text, res.data);
    })
    .catch(() => {
      m.focus();
    });
  };

  const edit = () => {
    const ent = m.getSelEnt();
    args.editVar(ent.data, ent.text)
    .then(res => {
      m.updateEnt(ent.key, res.text, clone(res.data));
    })
    .catch(() => {
      m.focus();
    });
  };

  const toolbar = () => {
    const ent = m.getSelEnt();
    return (
      <>
        <CSSIcon
          icon='fa fa-plus'
          show={ent == null}
          onClick={append}
        />
        <CSSIcon
          icon='fa fa-edit'
          show={ent != null}
          onClick={edit}
        />
      </>
    );
  };

  return new Promise((resolve, reject) => {
    const onOk = () => {
      res.close();
      resolve(convertFromDraft(m.getJSON().content));
    };

    const onCancel = () => {
      res.close();
      reject();
    };

    const res = showModal(
      <Subscriber model={m}>
        <Dialog
          isOpen
          isCloseButtonShown={false}
          title='Template editor'
          style={{ width: 500, height: 300 }}
        >
            <div className={cs.DIALOG_BODY} style={{ display: 'flex', userSelect: 'none' }}>
              <TextEditor
                toolbar={toolbar}
                model={m}
              />
            </div>
            <div className={cs.DIALOG_FOOTER}>
              <div className={cs.DIALOG_FOOTER_ACTIONS}>
                <Button text='OK' intent={Intent.PRIMARY} onClick={onOk} />
                <Button text='Cancel' onClick={onCancel} />
              </div>
            </div>
        </Dialog>
      </Subscriber>
    );
  });
}
