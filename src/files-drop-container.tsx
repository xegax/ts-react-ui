import * as React from 'react';
import { className as cn } from './common/common';
import { findParent } from './common/dom';

const classes = {
  overlay: 'files-drop-overlay',
  overlay2: 'files-drop-overlay2',
  content: 'files-drop-content',
  text: 'files-drop-text'
};

export interface Props extends React.HTMLProps<HTMLDivElement> {
  onDropFiles(files: Array<File>);
  onStartDrag?(files: Array<File>): boolean;
}

export interface State {
  drag?: boolean;
  filesCount?: number;
}

export class FilesDropContainer extends React.Component<Props, State> {
  private dropTgt = React.createRef<HTMLDivElement>();
  state: Readonly<State> = {};

  preventDefault = (e: Event) => e.preventDefault();

  onDragEnter = (event: React.DragEvent<any>) => {
    if (this.state.drag)
      return;

    const data = event.dataTransfer;
    if (!data.items)
      return;

    let files = Array<File>();
    for (let n = 0; n < data.items.length; n++) {
      const item = data.items[n];
      if (item.kind != 'file')
        continue;

      files.push(item.getAsFile());
    }

    if (!files.length || this.props.onStartDrag && !this.props.onStartDrag(files))
      return event.preventDefault();

    this.setState({ drag: true, filesCount: files.length });
  };

  onDrop = (event: React.DragEvent<any>) => {
    event.preventDefault();
    if (!this.state.drag)
      return;

    let files: Array<File> = [];
    for (let n = 0; n < event.dataTransfer.items.length; n++) {
      files.push( event.dataTransfer.items[n].getAsFile() );
    }
    this.props.onDropFiles(files);

    this.setState({ drag: false });
  };

  onDragLeave = (event: React.DragEvent<any>) => {
    const newTgt = event.relatedTarget as HTMLElement;
    if (findParent(newTgt, this.dropTgt.current))
      return;

    this.setState({ drag: false, filesCount: 0 });
  };

  render() {
    let childs = React.Children.toArray(this.props.children) as Array<JSX.Element>;
    if (!childs.length)
      return this.props.children;

    childs = [
      React.cloneElement(childs[0], {
        onDragEnter: this.onDragEnter,
        children: [
          ...React.Children.toArray(childs[0].props.children),
          this.state.drag &&
          <div
            key='overlay'
            className={cn(classes.overlay)}
            ref={this.dropTgt}
            onDrop={this.onDrop}
            onDragOver={evt => evt.preventDefault()}
            onDragEnter={this.onDragEnter}
            onDragLeave={this.onDragLeave}
          >
            <div className={classes.overlay2}/>
            <div className={classes.content}>
              <div className={classes.text}>drop {this.state.filesCount} files</div>
            </div>
          </div>
        ]
      }),
    ];

    return childs;
  }
}
