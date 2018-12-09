import * as React from 'react';
import { startDragging } from './common/start-dragging';
import { className as cn } from './common/common';

export interface Props {
  size: number | (() => number);
  min?: number;
  max?: number;
  onResize?(newSize: number);
  style?: React.CSSProperties;
}

export class VerticalResizer extends React.Component<Props & {height?: number}> {
  onResize(newSize: number) {
    if (this.props.min)
      newSize = Math.max(newSize, this.props.min);
    if (this.props.max)
      newSize = Math.min(newSize, this.props.max);

    this.props.onResize && this.props.onResize(newSize);
  }

  render() {
    const onMouseDown = e => {
      const size = typeof this.props.size == 'function' ?
        this.props.size :
        () => this.props.size as number;

      startDragging({ x: size(), y: 0}, {
        onDragging: event => {
          this.onResize(event.x);
        }
      })(e);
    };
  
    return (
      <div
        style={this.props.style}
        className={cn('resizer', 'vertical-resizer', this.props.height == null && 'fit-to-abs')}
        onMouseDown={onMouseDown}
      />
    );
  }
}

export class HorizontalResizer extends React.Component<Props & { width: number }> {
  ref = React.createRef<HTMLDivElement>();

  onResize(newSize: number) {
    if (this.props.min)
      newSize = Math.max(newSize, this.props.min);
    if (this.props.max)
      newSize = Math.min(newSize, this.props.max);

    this.props.onResize && this.props.onResize(newSize);
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
        className={cn('resizer', 'horizontal-resizer')}
        onMouseDown={this.onMouseDown}
      />
    );
  }
}
