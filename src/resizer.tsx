import * as React from 'react';
import { startDragging } from './common/start-dragging';
import { className as cn } from './common/common';

export interface Props {
  size: number | (() => number);
  min?: number;
  max?: number;
  onResizing?(newSize: number): void;
  onResized?(newSize: number): void;
  onDoubleClick?(e: React.MouseEvent): void;
  style?: React.CSSProperties;
}

export class VerticalResizer extends React.Component<Props & {height?: number}> {
  onResizing(newSize: number) {
    if (this.props.min)
      newSize = Math.max(newSize, this.props.min);
    if (this.props.max)
      newSize = Math.min(newSize, this.props.max);

    this.props.onResizing && this.props.onResizing(newSize);
  }

  onResized(newSize: number) {
    if (this.props.min)
      newSize = Math.max(newSize, this.props.min);
    if (this.props.max)
      newSize = Math.min(newSize, this.props.max);

    this.props.onResized && this.props.onResized(newSize);
  }

  render() {
    const onMouseDown = e => {
      const size = typeof this.props.size == 'function' ?
        this.props.size :
        () => this.props.size as number;

      startDragging({ x: size(), y: 0, minDist: 5 }, {
        onDragging: event => {
          this.onResizing(event.x);
        },
        onDragEnd: event => {
          this.onResized(event.x);
        }
      })(e);
    };
  
    return (
      <div
        style={this.props.style}
        className={cn('resizer', 'vertical-resizer', this.props.height == null && 'fit-to-abs')}
        onMouseDown={onMouseDown}
        onDoubleClick={e => {
          e.stopPropagation();
          this.props.onDoubleClick && this.props.onDoubleClick(e);
        }}
      />
    );
  }
}

export class HorizontalResizer extends React.Component<Props> {
  ref = React.createRef<HTMLDivElement>();

  onResize(newSize: number) {
    if (this.props.min)
      newSize = Math.max(newSize, this.props.min);
    if (this.props.max)
      newSize = Math.min(newSize, this.props.max);

    this.props.onResizing && this.props.onResizing(newSize);
  }

  onMouseDown = e => {
    const size = typeof this.props.size == 'function' ?
        this.props.size :
        () => this.props.size as number;

    startDragging({ x: 0, y: size()}, {
      onDragging: event => {
        this.onResize(event.y);
      }
    })(e);
  };

  render() {
    return (
      <div
        ref={this.ref}
        style={{
          ...this.props.style,
          width: this.ref.current && this.ref.current.parentElement.offsetWidth || null
        }}
        className={cn('resizer', 'horizontal-resizer', 'fit-to-abs')}
        onMouseDown={this.onMouseDown}
        onDoubleClick={e => {
          e.stopPropagation();
          this.props.onDoubleClick && this.props.onDoubleClick(e);
        }}
      />
    );
  }
}
