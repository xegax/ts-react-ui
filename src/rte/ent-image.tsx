import * as React from 'react';
import { uploadDialog, fileToBase64 } from '../upload';
import { EntEditor, EntRenderProps } from './helpers';
import { startDragging } from '../common/start-dragging';

const css = {
  wrapper: 'ent-img-wrapper',
  resizer: 'resizer'
};

export interface ImageData {
  base64img?: string;
  height?: number;
}

export const ImageToView: React.SFC<EntRenderProps<ImageData>> = props => {
  return (
    <img
      src={props.data.base64img}
      title={`${props.children}`}
      style={{ height: props.data.height }}
    />
  );
}

export class ImageToEdit extends React.Component<EntRenderProps<ImageData>, { height?: number }> {
  state = {};
  ref = React.createRef<HTMLDivElement>();

  render() {
    return (
      <div className={css.wrapper} ref={this.ref}>
        <ImageToView {...this.props}/>
        <div
          className={css.resizer}
          onDoubleClick={e => {
            if (this.props.data.height == null)
              return;

            this.props.data.height = undefined;
            this.props.onChanged();
            e.preventDefault();
            e.stopPropagation();
          }}
          onMouseDown={e => {
            const img = this.ref.current.querySelector('img');
            if (!img)
              return;

            startDragging({ x: 0, y: img.offsetHeight }, {
              onDragging: evt => {
                this.props.data.height = evt.y;
                this.setState({ height: evt.y });
              },
              onDragEnd: () => {
                this.props.onChanged();
              }
            })(e.nativeEvent);
          }}
        />
      </div>
    );
  }
}

function append(height: number) {
  return (
    uploadDialog({ accept: 'image/*' })
    .then(file => Promise.all([
      Promise.resolve(file[0].name),
      fileToBase64(file[0])
    ]))
    .then(([ name, base64img ]) => {
      return {
        label: name,
        data: { base64img, height }
      };
    })
  );
}

export function imageEditor(): EntEditor<ImageData> {
  const editor: EntEditor<ImageData> = {
    icon: 'fa fa-image',
    name: 'Image',
    append: () => {
      return append(200);
    },
    edit: ent => {
      return append(ent.data.height);
    }
  };

  return editor;
}
