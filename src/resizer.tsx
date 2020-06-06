import * as React from 'react';
import { startDragging } from './common/start-dragging';
import { className as cn, clamp } from './common/common';

export interface Props<T = 'left' | 'center' | 'right'> {
  side?: T;
  size: number | (() => number);
  scale?: number;
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

      let sizeValue = size();
      let newSize = sizeValue;
      startDragging({ x: 0, y: 0, minDist: 5 }, {
        onDragging: event => {
          newSize = sizeValue + event.x * (this.props.scale || 1);
          this.onResizing(newSize);
        },
        onDragEnd: event => {
          this.onResized(newSize);
        }
      })(e);
    };
  
    return (
      <div
        style={this.props.style}
        className={cn('resizer', 'vertical-resizer', this.props.height == null && 'fit-to-abs', this.props.side || 'right')}
        onMouseDown={onMouseDown}
        onDoubleClick={e => {
          e.stopPropagation();
          this.props.onDoubleClick && this.props.onDoubleClick(e);
        }}
      />
    );
  }
}

export class HorizontalResizer extends React.Component<Props<'top' | 'center' | 'bottom'>> {
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
        className={cn('resizer', 'horizontal-resizer', 'fit-to-abs', this.props.side || 'bottom')}
        onMouseDown={this.onMouseDown}
        onDoubleClick={e => {
          e.stopPropagation();
          this.props.onDoubleClick && this.props.onDoubleClick(e);
        }}
      />
    );
  }
}

interface FlexProps {
  vertical?: boolean;
  tgtSize: number;
  size?: number;

  min?: number;
  max?: number;

  onResizing?(newSize: number): void;
  onResized?(newSize: number): void;
  onReset?(): void;
}

interface FlexState {
  drag?: boolean;
}

export class FlexResizer extends React.Component<FlexProps, FlexState> {
  state: FlexState = {
    drag: false
  };

  private onMouseDown = (e: React.MouseEvent) => {
    const { onResizing, onResized, vertical, min, max } = this.props;
    if (!onResizing && !onResized)
      return;

    e.preventDefault();
    e.stopPropagation();

    const vmin = min != null ? min : -10000;
    const vmax = max != null ? max : 10000;
    const currSize = this.props.tgtSize;
    startDragging({ x: 0, y: 0, minDist: 0 }, {
        onDragStart: () => {
          this.setState({ drag: true });
        },
        onDragging: evt => {
          onResizing && onResizing( clamp(currSize + (vertical ? evt.x : evt.y), [vmin, vmax]) );
        },
        onDragEnd: evt => {
          this.setState({ drag: false });
          onResized && onResized( clamp(currSize + (vertical ? evt.x : evt.y), [vmin, vmax]) );
        }
    })(e.nativeEvent);
  }

  render() {
    return (
      <div
        className={cn(
          'resizer',
          this.props.vertical ? 'flex-vert-resizer' : 'flex-horz-resizer',
          this.state.drag && 'drag',
          !this.props.onResizing && !this.props.onResized && 'disabled'
        )}
        style={this.props.vertical ? { width: this.props.size } : { height: this.props.size }}
        onMouseDown={this.onMouseDown}
        onDoubleClick={this.props.onReset}
      />
    );
  }
}