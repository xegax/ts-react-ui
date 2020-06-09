import * as React from 'react';
import {
  LayoutSchema,
  SchemaContainer,
  SchemaElement,
  SchemaItem,
  ContainerType,
  isSchemaElement,
  SchemaSize
} from './layout-schema';
import { Props as ElementProps } from './layout-element';
import { startDragging } from '../common/start-dragging';
import { isPointInRect, Rect, isRectsEqual } from '../common/rect';
import { Point } from '../common/point';
import { LayoutBase } from './layout-base';

function toRect(domRect: ClientRect): Rect {
  return {
    x: domRect.left,
    y: domRect.top,
    width: domRect.right - domRect.left,
    height: domRect.bottom - domRect.top
  };
}

interface Props {
  schema: LayoutSchema;

  style?: React.CSSProperties;

  className?: string;
  children?: React.ReactNode;
  onChanged?(newSchema: LayoutSchema): void;
  onKeysChanged?(newSchema: LayoutSchema): void;
  wrapper?(item: SchemaItem, jsx: JSX.Element): JSX.Element;
}

interface State {
  dragHover?: boolean;
  insert?: {
    type: string;
    ckey?: string;
    ekey?: string;
    idx?: number;
    showRect: Rect;
  };
}

interface DragHandle {
  getElement(): HTMLElement;

  onDragStart?(): void;
  onDrag?(pt: Point): void;
  onDragLeave?(): void;
  onDrop?(pt?: Point): void;
}

let elKeyCounter = 0;
export class Layout extends React.Component<Props, State> implements DragHandle {
  ref = React.createRef<LayoutBase>();
  state: State = {};

  getElement() {
    return this.ref.current.getElement();
  }

  getDOMElement(key: string) {
    return this.ref.current.getDOMElement(key);
  }

  private onChanged() {
    this.ref.current.onChanged();
  }

  private findItemByKey(key: string) {
    return this.ref.current.findItemByKey(key);
  }

  updateItem(key: string, attr: SchemaSize) {
    let tmp = this.getItemByKey(key);
    const item = tmp.item;
    if (!tmp || !item)
      return;

    let cont = tmp.cont;
    if (!cont)
      return;

    let changed = 0;
    Object.keys(attr).forEach(k => {
      if (item[k] == attr[k])
        return;

      if (attr[k] == null)
        delete item[k];
      else
        item[k] = Math.floor(attr[k]);
      changed++;
    });

    while (cont) {
      const resizer = this.ref.current.getResizer(cont);
      cont.items.forEach(c => {
        c.grow = resizer.getGrow(c);
      });
      tmp = this.getItemByKey(cont.key);
      cont = tmp ? tmp.cont : undefined;
    }

    if (changed && this.props.onChanged)
      this.onChanged();
  }

  remove(key: string) {
    let { item, cont } = this.findItemByKey(key);
    if (!item || !cont)
      return;

    const idx = cont.items.indexOf(item);
    cont.items.splice(idx, 1);
    if (cont.items.length == 1)
      cont.items[0].grow = 1;

    this.onChanged();
  }

  onDragStart() {
    this.setState({ dragHover: true });
  }

  onDrag(pt: Point) {
    this.setState({ insert: this.findInsertPlace(pt) });
  }

  onDragLeave() {
    this.setState({ insert: undefined });
  }

  onDrop() {
    const insert = this.state.insert;
    if (insert) {
      const ctmp = this.getItemByKey(insert.ckey);
      const { cont } = isSchemaElement(ctmp.item);
      if (!cont)
        return;

      const newEl: SchemaElement = {
        grow: 1,
        key: 'el-' + (++elKeyCounter)
      };

      const t = insert.type;
      if (t == 'insert') {
        cont.items.splice(insert.idx, 0, newEl);
      } else if (t == 'split') {
        const elIdx = cont.items.findIndex(el => el.key == insert.ekey);
        const el = cont.items[elIdx];
        if (el) {
          cont.items.splice(elIdx, 1, {
            key: 'cont-' + (++elKeyCounter),
            type: cont.type == 'column' ? 'row' : 'column',
            grow: el.grow,
            items: insert.idx == 0 ? [newEl, el] : [el, newEl] 
          });
          el.grow = 1;
        }
      }
      this.onChanged();
    }

    this.setState({ dragHover: false, insert: undefined });
  }

  private getItemByKey(key:  string) {
    return this.ref.current.getItemByKey(key);
  }

  private findInsertPlace(pt: Point) {
    if (!this.ref.current)
      return;

    const bbox = this.getElement().getBoundingClientRect();
    let rect = {...toRect(bbox), x: 0, y: 0 };
    if (this.props.schema.root.items.length == 0) {
      return {
        type: 'insert',
        idx: 0,
        ckey: this.props.schema.root.key,
        showRect: rect
      };
    }

    const key = this.findKeyByPoint(pt);
    if (!key)
      return;

    const tmp = this.getItemByKey(key);
    if (!tmp || !tmp.ref)
      return;

    let { cont, item } = this.findItemByKey(key);
    const crect = tmp.ref.current.getBoundingClientRect();
    let res = findPlaceToInsert(toRect(crect), cont.type, pt);
    if (!res)
      return;

    res = {...res};
    const showRect = {...res.rect};
    showRect.x -= bbox.left;
    showRect.y -= bbox.top;

    if (res.type == 'insert2') {
      res.type = 'insert';
      const tmp2 = this.getItemByKey(cont.key);
      if (tmp2.cont) {
        item = cont;
        cont = tmp2.cont;
        const crect2 = tmp2.ref.current.getBoundingClientRect();
        if (cont.type == 'row') {
          showRect.y = crect2.top - bbox.top;
          showRect.height = crect2.height;
        } else {
          showRect.width = crect2.width;
          showRect.x = crect2.left - bbox.left;
        }
      }
    }

    return {
      type: res.type,
      ckey: cont.key,
      ekey: item.key,
      idx: res.type == 'split' ? res.idx : cont.items.indexOf(item) + res.idx,
      showRect
    };
  }

  private findKeyByPoint(pt: Point) {
    return Object.keys(this.ref.current.state.keyToItem).find(key => {
      const tmp = this.getItemByKey(key);
      if (tmp && 'items' in tmp.item && tmp.item.items.length)
        return;

      const r = toRect(tmp.ref.current.getBoundingClientRect());
      const cont = tmp.cont;
      if (cont) {
        if (cont.items[cont.items.length - 1] != tmp.item) {
          if (cont.type == 'row')
            r.width += 10;
          else
            r.height += 10;
        }
      }

      return isPointInRect(pt, r);
    });
  }

  render() {
    const insert = this.state.insert;
    return (
      <>
        <LayoutBase
          ref={this.ref}
          schema={this.props.schema}
          wrapper={this.props.wrapper}
          style={this.props.style}
          onChanged={this.props.onChanged}
          onKeysChanged={this.props.onKeysChanged}
        >
          {this.props.children}
        </LayoutBase>
        {this.state.dragHover ? (
          <div
            className='abs-fit'
            style={{ backgroundColor: 'silver', opacity: 0.5, overflow: 'hidden' }}
          >
            {insert ? (
              <div
                style={{
                  backgroundColor: 'blue',
                  opacity: 0.5,
                  position: 'absolute',
                  left: insert.showRect.x,
                  top: insert.showRect.y,
                  width: insert.showRect.width,
                  height: insert.showRect.height
                }}
              />
            ) : undefined}
          </div>
        ) : undefined}
      </>
    );
  }
}

export const Draggable: React.SFC<{ handle: DragHandle }> = props => {
  return (
    React.cloneElement(React.Children.only(props.children), {
      onMouseDown: evt => {
        const el = props.handle.getElement();
        const elRect = el.getBoundingClientRect();
        let hover = false;
        startDragging({ x: 0, y: 0 }, {
          onDragStart: () => {
            if (props.handle.onDragStart)
              props.handle.onDragStart();
          },
          onDragging: evt => {
            if (!props.handle.onDrag)
              return;

            const mevt = evt.event as MouseEvent;
            const mpt = { x: mevt.pageX, y: mevt.pageY };
            if (isPointInRect(mpt, toRect(elRect))) {
              hover = true;
              props.handle.onDrag(mpt);
            } else if (hover) {
              hover = false;
              props.handle.onDragLeave && props.handle.onDragLeave();
            }
          },
          onDragEnd: evt => {
            if (!props.handle.onDrop)
              return;

            const mevt = evt.event as MouseEvent;
            const mpt = { x: mevt.pageX, y: mevt.pageY };
            props.handle.onDrop( isPointInRect(mpt, toRect(elRect)) ? mpt : undefined );
          }
        })(evt);
      }
    })
  );
}

type PlaceType = 'split' | 'insert' | 'insert2';
interface PlaceResult {
  type: PlaceType;
  idx: number;
  rect: Rect;
}

const dropAreas: {
  contRect: Rect;
  contType: ContainerType;
  areas: Array<PlaceResult>;
} = {
  contRect: { x: 0, y: 0, width: 0, height: 0 },
  contType: 'column',
  areas: []
};

function findPlaceToInsert(contRect: Rect, contType: ContainerType, pt: Point): PlaceResult {
  if (!isRectsEqual(contRect, dropAreas.contRect) || contType != dropAreas.contType) {
    dropAreas.contRect = {...contRect};
    dropAreas.contType = contType;
    const areas = dropAreas.areas = Array<PlaceResult>();

    const hBorder = 10;
    const wBorder = 10;
    if (contType == 'column') {
      areas.push({
        type: 'insert',
        idx: 0,
        rect: {
          ...contRect,
          height: hBorder
        }
      });

      areas.push({
        type: 'insert',
        idx: 1,
        rect: {
          ...contRect,
          y: contRect.y + contRect.height - hBorder,
          height: hBorder
        }
      });

      areas.push({
        type: 'insert2',
        idx: 0,
        rect: {
          ...contRect,
          width: wBorder
        }
      });

      areas.push({
        type: 'insert2',
        idx: 1,
        rect: {
          ...contRect,
          x: contRect.x + contRect.width - wBorder,
          width: wBorder
        }
      });

      areas.push({
        type: 'split',
        idx: 0,
        rect: {
          ...contRect,
          width: contRect.width / 2
        }
      });

      areas.push({
        type: 'split',
        idx: 1,
        rect: {
          ...contRect,
          x: contRect.x + contRect.width / 2,
          width: contRect.width / 2
        }
      });
    } else {
      areas.push({
        type: 'insert',
        idx: 0,
        rect: {
          ...contRect,
          width: wBorder
        }
      });

      areas.push({
        type: 'insert',
        idx: 1,
        rect: {
          ...contRect,
          x: contRect.x + contRect.width - wBorder,
          width: wBorder
        }
      });

      areas.push({
        type: 'insert2',
        idx: 0,
        rect: {
          ...contRect,
          height: hBorder
        }
      });

      areas.push({
        type: 'insert2',
        idx: 1,
        rect: {
          ...contRect,
          y: contRect.y + contRect.height - hBorder,
          height: hBorder
        }
      });

      areas.push({
        type: 'split',
        idx: 0,
        rect: {
          ...contRect,
          height: contRect.height / 2
        }
      });

      areas.push({
        type: 'split',
        idx: 1,
        rect: {
          ...contRect,
          y: contRect.y + contRect.height / 2,
          height: contRect.height / 2
        }
      });
    }
  }

  return dropAreas.areas.find(area => isPointInRect(pt, area.rect));
}
