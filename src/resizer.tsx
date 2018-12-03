import * as React from 'react';
import { startDragging } from '../common/start-dragging';
import { clamp } from '../common/common';

export interface Props {
  size: number;
  min?: number;
  max?: number;
  onResize?(newSize: number);
}

export class VerticalResizer extends React.Component<Props> {
  onResize(newSize: number) {
    if (this.props.min)
      newSize = Math.max(newSize, this.props.min);
    if (this.props.max)
      newSize = Math.min(newSize, this.props.max);

    this.props.onResize && this.props.onResize(newSize);
  }

  render() {
    const onMouseDown = e => {
      const size = this.props.size;
      startDragging({ x: size, y: 0}, {
        onDragging: event => {
          this.onResize(event.x);
        }
      })(e);
    };
  
    return (
      <div className='resizer vertical-resizer' onMouseDown={onMouseDown}/>
    );
  }
}

export class HorizontalResizer extends React.Component<Props> {
  onResize(newSize: number) {
    if (this.props.min)
      newSize = Math.max(newSize, this.props.min);
    if (this.props.max)
      newSize = Math.min(newSize, this.props.max);

    this.props.onResize && this.props.onResize(newSize);
  }

  render() {
    const onMouseDown = e => {
      const size = this.props.size;
      startDragging({ x: 0, y: size}, {
        onDragging: event => {
          this.onResize(event.y);
        }
      })(e);
    };
  
    return (
      <div className='resizer horizontal-resizer' onMouseDown={onMouseDown}/>
    );
  }
}
