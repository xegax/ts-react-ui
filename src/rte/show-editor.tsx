import * as React from 'react';
import { showModal } from '../show-modal';
import {
  Dialog,
  Button,
  Intent,
  Classes as cs
} from '@blueprintjs/core';
import { TextEditor, TextEditorModel, TextEditorJSON } from './text-editor';
import { EntEditor } from './helpers';

export interface EditorArgs {
  json?: TextEditorJSON;
  title?: string;
  entEditorMap?: Record<string, EntEditor>;
  width?: number;
  height?: number;
}

export function showEditor(args: EditorArgs): Promise<TextEditorJSON> {
  const title = args.title || 'Text editor';
  const m = TextEditorModel.create(args.json);
  return new Promise((resolve, reject) => {
    const onOk = () => {
      res.close();
      resolve(m.getJSON());
    };

    const onCancel = () => {
      res.close();
      reject();
    };

    const res = showModal(
      <Dialog
        isOpen
        isCloseButtonShown={false}
        title={title}
        style={{
          width: args.width || 600,
          height: args.height || 500
        }}
      >
        <div className={cs.DIALOG_BODY} style={{ display: 'flex' }}>
          <TextEditor
            model={m}
            entEditorMap={args.entEditorMap}
          />
        </div>
        <div className={cs.DIALOG_FOOTER}>
          <div className={cs.DIALOG_FOOTER_ACTIONS}>
            <Button text='OK' intent={Intent.PRIMARY} onClick={onOk}/>
            <Button text='Cancel' onClick={onCancel}/>
          </div>
        </div>
      </Dialog>
    );
  });
}
