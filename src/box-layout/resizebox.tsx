import * as React from 'react';
import { cn } from '../common/common';
import { startDragging } from '../common/start-dragging';
import { CSSRect } from '../common/rect';
import { Point } from '../common/point';
import { HandlerArgs } from '../common/start-dragging';

const css = {
  resizebox: 'resizebox',
  point: 'point',
  lt: 'lt',
  rt: 'rt',
  lb: 'lb',
  rb: 'rb'
};

interface Props<T = any> {
  rect: CSSRect;
  onStart?(): T;
  onResizing?(rect: CSSRect, ctx: T): void;
  onResized?(rect: CSSRect, ctx: T): void;
  alignPoint?(pt: Point): Point;
}

export class ResizeBox<T = any> extends React.Component<Props<T>> {
  private alignPoint(pt: Point): Point {
    if (this.props.alignPoint)
      return this.props.alignPoint(pt) || pt;

    return pt;
  }

  private startDragging(evt: React.MouseEvent, point: 'lt' | 'rt' | 'lb' | 'rb') {
    const rect: CSSRect = {...this.props.rect};

    const left = point == 'lt' || point == 'lb';
    const right = point == 'rb' || point == 'rt';
    const top = point == 'lt' || point == 'rt';
    const bottom = point == 'lb' || point == 'rb';

    evt.stopPropagation();

    const getRect = (evt: HandlerArgs) => {
      const pt = this.alignPoint(evt);
      const newRect = {...rect};
      if (left)
        newRect.left += pt.x;

      if (right)
        newRect.right += pt.x;

      if (top)
        newRect.top += pt.y;

      if (bottom)
        newRect.bottom += pt.y;

      return newRect;
    };

    let ctx = {} as T;
    startDragging({ x: 0, y: 0 }, {
      onDragStart: () => {
        ctx = {...this.props.onStart?.()};
      },
      onDragging: evt => {
        this.props.onResizing?.(getRect(evt), ctx);
      },
      onDragEnd: evt => {
        this.props.onResized?.(getRect(evt), ctx);
      }
    })(evt.nativeEvent);
  }

  render() {
    return (
      <div className={cn('abs-fit', css.resizebox)}>
        {this.props.children}
        <div
          className={cn('abs', css.point, css.lt)}
          onMouseDown={evt => this.startDragging(evt, 'lt')}
        />
        <div
          className={cn('abs', css.point, css.rt)}
          onMouseDown={evt => this.startDragging(evt, 'rt')}
        />
        <div
          className={cn('abs', css.point, css.rb)}
          onMouseDown={evt => this.startDragging(evt, 'rb')}
        />
        <div
          className={cn('abs', css.point, css.lb)}
          onMouseDown={evt => this.startDragging(evt, 'lb')}
        />
      </div>
    );
  }
}
