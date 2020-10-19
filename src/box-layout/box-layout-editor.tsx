import * as React from 'react';
import { BoxLayoutEditorModel, normalizeRect, getBoxRect, getBoxXAxis, getBoxYAxis } from './box-layout-editor-model';
import { BoxLayout, RenderBoxResult } from './box-layout';
import { Box } from './box-layout-decl';
import { startDragging } from '../common/start-dragging';
import { cn } from '../common/common';
import { isLeftDown } from '../common/event-helpers';
import { findParentByFunc } from '../common/dom';
import { KeyCode } from '../common/keycode';
import { Point, Size } from '../common/point';
import { ResizeBox } from './resizebox';
import { toCSSRect } from '../common/rect';

const css = {
  layoutEditor: 'box-layout-editor',
  box: 'boxitem',
  select: 'select-boxitem'
};

interface Props<T = any> {
  model?: BoxLayoutEditorModel;
  data?: T;
  renderBox?(box: Box, data?: T): RenderBoxResult;
  createBox?(box: Box): void;
  size?: Size;
}

interface State {
  model?: BoxLayoutEditorModel;
  notify?(): void;
}

export class BoxLayoutEditor<T = any> extends React.Component<Props<T>> {
  private ref = React.createRef<HTMLDivElement>();

  state: State = {
    notify: () => {
      this.setState({});
    }
  };

  static getDerivedStateFromProps(next: Props, state: State): Partial<State> | null {
    if (next.model != state.model) {
      state.model?.unsubscribe(state.notify);
      next.model?.subscribe(state.notify);

      return { model: next.model };
    }

    return null;
  }

  private onKeyDown = (evt: React.KeyboardEvent) => {
    if (evt.keyCode == KeyCode.DELETE) {
      this.props.model.deleteByKeys( new Set(this.props.model.getSelectedKeys()) );
    }
  };

  private findBoxKey(evt: React.MouseEvent): string | undefined {
    const tgt = evt.target as HTMLElement;
    const boxEl = findParentByFunc(tgt, p => p.getAttribute('data-boxkey') != null);
    if (!boxEl)
      return undefined;

    return boxEl.getAttribute('data-boxkey');
  }

  private startDraggingBox = (evt: React.MouseEvent) => {
    const m = this.props.model;
    const box = m.getBoxByKey(evt.currentTarget.getAttribute('data-boxkey'));
    if (!box)
      return;

    if (!m.isSelect(box.key) && !evt.ctrlKey)
      m.clearSelect();

    m.selectBox(box.key);

    if (!isLeftDown(evt.nativeEvent))
      return;

    const rects = m.getSelectedKeys()
    .map(key => {
      const box = m.getBoxByKey(key);

      const rect = normalizeRect(box.rect, this.props.size);
      return {
        box,
        x: getBoxXAxis(box.rect),
        y: getBoxYAxis(box.rect),
        rect
      };
    });

    evt.stopPropagation();

    startDragging({ x: 0, y: 0, minDist: 2 }, {
      onDragging: evt => {
        const ofs = this.alignPoint(evt);
        rects.forEach(item => {
          item.box.rect = {
            left: item.rect.x + ofs.x,
            top: item.rect.y + ofs.y,
            width: item.rect.width,
            height: item.rect.height
          };
        });

        m.notify();
      },
      onDragEnd: () => {
        rects.forEach(item => {
          item.box.rect = getBoxRect({
            box: item.box,
            x: item.x as any,
            y: item.y as any,
            contSize: this.props.size
          });
        });
        m.notify();
      }
    })(evt.nativeEvent);
  };

  private renderBox = (box: Box) => {
    const m = this.props.model;
    const className = cn(
      'abs-fit',
      css.box,
      m.isSelect(box.key) && css.select
    );

    const boxRes = this.props.renderBox?.(box, this.props.data);
    let jsx = (
      <div
        className={cn(className, boxRes?.className)}
        onMouseDown={this.startDraggingBox}
        style={{...boxRes?.style}}
        {...{'data-boxkey': box.key}}
      >
        {boxRes?.jsx || box.key}
        {box.key == m.getActiveBoxKey() ? (
          <ResizeBox<{ x: string; y: string; }>
            rect={toCSSRect(normalizeRect(box.rect, this.props.size))}
            onStart={() => {
              return {
                x: getBoxXAxis(box.rect),
                y: getBoxYAxis(box.rect)
              };
            }}
            onResizing={rect => {
              box.rect = {
                left: rect.left,
                top: rect.top,
                width: rect.right - rect.left,
                height: rect.bottom - rect.top
              };

              m.notify();
            }}
            onResized={(rect, ctx) => {
              box.rect = getBoxRect({
                box,
                x: ctx.x as any,
                y: ctx.y as any,
                contSize: this.props.size
              });

              m.notify();
            }}
            alignPoint={this.alignPoint}
          />
        ) : null}
      </div>
    );

    return { jsx };
  };

  private getRelPoint(evt: React.MouseEvent<any>) {
    const bbox = this.ref.current.getBoundingClientRect();
    return {
      x: evt.pageX - bbox.left,
      y: evt.pageY - bbox.top
    };
  }

  private alignPoint = (pt: Point) => {
    const gridSize = 10;
    pt.x += gridSize / 2;
    pt.y += gridSize / 2;
    return {
      x: Math.floor(pt.x / gridSize) * gridSize,
      y: Math.floor(pt.y / gridSize) * gridSize
    };
  }

  render() {
    return (
      <div
        tabIndex={0}
        ref={this.ref}
        className={cn('abs-fit', css.layoutEditor)}
        onKeyDown={this.onKeyDown}
        onMouseDown={evt => {
          if (!this.findBoxKey(evt))
            this.props.model.clearSelect();
        }}
        onDoubleClick={evt => {
          const pt = this.alignPoint(this.getRelPoint(evt));
          const rect = {
            left: pt.x,
            top: pt.y,
            width: 100,
            height: 50
          };

          const newBox = this.props.model.createBox({ rect });
          this.props?.createBox(newBox);
        }}
      >
        <BoxLayout
          boxArr={this.state.model.getBoxArr()}
          renderBox={this.renderBox}
        />
        {this.props.children}
      </div>
    );
  }
}
