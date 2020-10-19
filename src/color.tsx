import * as React from 'react';
import { SketchPicker } from 'react-color';
import { showModal } from './show-modal';
import { Dialog } from './blueprint';

function parseRGBA(s: string) {
  if (!s)
    return '#ffffff';

  if (s[0] == '#')
    return s;

  if (!s.startsWith('rgba'))
    return { r: 0, g: 0, b: 0, a: 1 };

  const c = s.split('(');
  const rgba = c[1].split(',');
  return {
    r: parseInt(rgba[0]),
    g: parseInt(rgba[1]),
    b: parseInt(rgba[2]),
    a: parseFloat(rgba[3]) ?? 1
  };
}

interface GetColorArgs {
  title?: string;
  color: string;
  onChanging?(newColor: string): void;
}

export function getColor(args: GetColorArgs) {
  let newColor: string = args.color;
  return new Promise<string>((resolve, reject) => {
    const dlg = showModal(
      <Dialog
        title={args.title}
        isCloseButtonShown
        isOpen
        onClose={evt => {
          if (evt.type == 'keydown')
            reject('cancel');
          else
            resolve(newColor);

          dlg.close();
        }}
        style={{width: 'unset', height: 'unset', padding: 0}}
      >
        <SketchPicker
          color={parseRGBA(args.color)}
          onChangeComplete={color => {
            const rgb = color.rgb;
            newColor = `rgba(${rgb.r},${rgb.g},${rgb.b},${rgb.a})`;
            args.onChanging && args.onChanging(newColor);
          }}
        />
      </Dialog>
    );
  });
}
