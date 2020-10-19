import * as React from 'react';
import { showModal } from '../show-modal';
import {
  Dialog,
  Button,
  Intent,
  Classes as cs
} from '@blueprintjs/core';
import { TextEditor, TextEditorModel, TextEditorJSON } from './text-editor';

export interface EditorArgs {
  json?: TextEditorJSON;
  title?: string;
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
      <Dialog isOpen isCloseButtonShown={false} title={title}>
        <div className={cs.DIALOG_BODY}>
          <TextEditor model={m}/>
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
