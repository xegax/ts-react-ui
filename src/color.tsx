import * as React from 'react';
import { SketchPicker } from 'react-color';
import { showModal } from './show-modal';
import { Dialog } from './blueprint';

interface GetColorArgs {
  title?: string;
  color: string;
  onChanging?(newColor: string): void;
}

export function getColor(args: GetColorArgs): Promise<string> {
  let newColor: string = args.color;
  let p = Promise.defer<string>();

  const dlg = showModal(
    <Dialog
      title={args.title}
      isCloseButtonShown
      isOpen
      onClose={evt => {
        if (evt.type == 'keydown')
          p.reject('cancel');
        else
          p.resolve(newColor);

        dlg.close();
      }}
      style={{width: 'unset', height: 'unset', padding: 0}}
    >
      <SketchPicker
        color={args.color}
        onChangeComplete={color => {
          newColor = color.hex;
          args.onChanging && args.onChanging(color.hex);
        }}
      />
    </Dialog>
  );

  return p.promise;
}
