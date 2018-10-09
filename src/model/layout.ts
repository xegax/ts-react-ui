import { Publisher } from 'objio/common/publisher';
import { Rect } from '../common/rect';
import { Point } from '../common/point';

export type EventType = 'change' | 'drop';
export type LayoutType = 'row' | 'col';
export type MapType = {[id: string]: JSX.Element};
export type PutPlace = 'top' | 'bottom' | 'left' | 'right' | 'after' | 'before';

export interface LayoutItem {
  id: string;
  grow?: number;
  ref?: React.RefObject<HTMLDivElement>;
  parent?: LayoutCont;
}

export interface LayoutCont {
  items: Array<LayoutCont | LayoutItem>;
  type: LayoutType;
  grow?: number;
  ref?: React.RefObject<HTMLDivElement>;
  parent?: LayoutCont;
}

export interface DropZone {
  show: Rect;
  putPlace: PutPlace;
  item: LayoutItem | LayoutCont;
}

export function clone(itemOrCont: LayoutCont | LayoutItem): LayoutCont | LayoutItem {
  const {ref, parent, ...other} = itemOrCont;
  const cont = other as LayoutCont;
  if (cont.items)
    cont.items = cont.items.map(item => clone(item));
  return cont;
}

export function updateParents(cont: LayoutCont | LayoutItem) {
  const contItem = cont as LayoutCont;
  if (!contItem.items)
    return;

  contItem.items.forEach(item => {
    item.parent = contItem;
    updateParents(item);
  });
}

function removeEmpty(cont: LayoutCont) {
  if (cont.items.length != 0 || !cont.parent)
    return;

  const i = cont.parent.items.indexOf(cont);
  if (i == -1)
    return;

  cont.parent.items.splice(i, 1);
  removeEmpty(cont.parent);
}

export interface LayoutHandler {
  onDrop?(item: any): LayoutItem | null;
}

export interface FindPutContResult {
  item: LayoutItem | LayoutCont;
  cont: LayoutCont;
  idx: number;
}

export class LayoutModel extends Publisher<EventType> {
  private map: MapType = {};
  private layout: LayoutCont = { items: [], type: 'row' };
  private lastDrop: LayoutItem;
  private handler: LayoutHandler = {};

  setHandler(handler: LayoutHandler) {
    this.handler = handler;
  }

  getHandler(): LayoutHandler {
    return this.handler;
  }

  getLayout(): LayoutCont {
    return this.layout;
  }

  setLayout(cont: LayoutCont): void {
    this.layout = cont;
    updateParents(this.layout);

    this.delayedNotify({type: 'change'});
  }

  setLastDrop(drop: LayoutItem): void {
    this.lastDrop = drop;
    updateParents(this.layout);
    this.delayedNotify({type: 'drop'});
  }

  getLastDrop(): LayoutItem {
    return this.lastDrop;
  }

  remove(id: string, cont?: LayoutCont): boolean {
    cont = cont || this.layout;
    const idx = cont.items.findIndex((item: LayoutItem) => item.id == id );
    if (idx != -1) {
      cont.items.splice(idx, 1);
      removeEmpty(cont);

      if (cont.items.length == 0)
        cont = cont.parent;

      if (cont) {
        let grow = 0;
        cont.items.forEach(item => {
          grow += (item.grow || 1);
        });

        if (grow < cont.items.length) {
          let shareGrow = cont.items.length - grow;
          cont.items.forEach(item => {
            item.grow = (item.grow || 1) + shareGrow;
          });
        }
      }

      this.delayedNotify({type: 'change'});
      return true;
    }

    for (let n = 0; n < cont.items.length; n++) {
      const next = cont.items[n] as LayoutCont;
      if (!next.items)
        continue;

      if (this.remove(id, next))
        return true;
    }

    return false;
  }

  findParent(tgt: LayoutCont | LayoutItem, parent?: LayoutCont): LayoutCont {
    parent = parent || this.layout;
    if (parent.items.find(item => item == tgt ))
      return parent;

    for (let n = 0; n < parent.items.length; n++) {
      let cont = parent.items[n] as LayoutCont;
      if (!cont.items)
        continue;

      cont = this.findParent(tgt, cont);
      if (cont)
        return cont;
    }

    return null;
  }

  getMap(): MapType {
    return this.map;
  }

  setMap(map: MapType): void {
    this.map = {...map};
    this.delayedNotify({type: 'change'});
  }

  findPutContainer(newItem: LayoutItem, relItem: LayoutCont | LayoutItem | null, place: PutPlace): FindPutContResult {
    let relItemParent: LayoutCont = null;
    let relItemIdx = -1;
    if (relItem) {
      if (!(relItemParent = this.findParent(relItem)))
        return null;

      relItemIdx = relItemParent.items.indexOf(relItem);
      if (relItemIdx == -1)
        return null;
    } else {
      relItem = this.layout;
    }

    // 'before' or 'after' put newItem into the middle
    if (place == 'before') {
      return {
        cont: relItemParent,
        idx: relItemIdx,
        item: newItem
      };
    } else if (place == 'after') {
      return {
        cont: relItemParent,
        idx: relItemIdx + 1,
        item: newItem
      };
    } else {
      let newCont: LayoutCont;
      if (place == 'top') {
        newCont = { items: [newItem, relItem], type: 'col' };
      } else if (place == 'bottom') {
        newCont = { items: [relItem, newItem], type: 'col' };
      } else if (place == 'left') {
        newCont = { items: [newItem, relItem], type: 'row' };
      } else if (place == 'right') {
        newCont = { items: [relItem, newItem], type: 'row' };
      } else {
        return null;
      }
      
      if (!relItemParent) {
        return {
          cont: null,
          idx: -1,
          item: newCont
        };
      }

      return {
        cont: relItemParent,
        idx: relItemIdx,
        item: newCont
      };
    }
  }

  putRelativeTo(newItem: LayoutItem, relItem: LayoutCont | LayoutItem | null, place: PutPlace): boolean {
    const res = this.findPutContainer(newItem, relItem, place);
    if (!res)
      return false;
     
    if (!res.cont && (res.item as LayoutCont).type) {
      this.layout = res.item as LayoutCont;
    } else {
      if (res.item != newItem && relItem.grow != null) {
        res.item.grow = relItem.grow;
        delete relItem.grow;
      }

      res.cont.items.splice(res.idx, res.item == newItem ? 0 : 1, res.item);
    }

    return true;
  }

  getRootDropZone(cursor: Point): DropZone {
    const rootRect = this.layout.ref.current.getBoundingClientRect();
    if (cursor.x - rootRect.left <= 5) {
      return {
        putPlace: 'left',
        item: null,
        show: {x: rootRect.left, y: rootRect.top, width: rootRect.width / 2, height: rootRect.height}
      };
    } else if (rootRect.right - cursor.x <= 5) {
      return {
        putPlace: 'right',
        item: null,
        show: {x: rootRect.left + rootRect.width / 2, y: rootRect.top, width: rootRect.width / 2, height: rootRect.height}
      };
    } else if (cursor.y - rootRect.top <= 5) {
      return {
        putPlace: 'top',
        item: null,
        show: {x: rootRect.left, y: rootRect.top, width: rootRect.width, height: rootRect.height / 2}
      };
    } else if (rootRect.bottom - cursor.y <= 5) {
      return {
        putPlace: 'bottom',
        item: null,
        show: {x: rootRect.left, y: rootRect.top + rootRect.height / 2, width: rootRect.width, height: rootRect.height / 2}
      };
    }

    return null;
  }

  findDropZone1(relItem: LayoutItem | LayoutCont, cursor: Point): DropZone {
    let cont = this.findParent(relItem);
    if (!cont)
      return null;

    const bbox = relItem.ref.current.getBoundingClientRect();
    const rect = {x: bbox.left, y: bbox.top, width: bbox.width, height: bbox.height};
    const itemIdx = cont.items.indexOf(relItem);

    const minDist = 20;
    if (cont.type == 'row') {
      if (cursor.x - rect.x <= minDist) {
        const show = {...rect, width: rect.width / 2};
        if (itemIdx != 0)
          show.x -= show.width / 2;
        return { putPlace: 'before', show, item: relItem };
      } else if (rect.x + rect.width - cursor.x <= minDist) {
        const show = {...rect, x: rect.x + rect.width / 2, width: rect.width / 2};
        if (itemIdx != cont.items.length - 1)
          show.x += show.width / 2;
        return { putPlace: 'after', show, item: relItem };
      } else if (cursor.y - rect.y <= minDist || rect.y + rect.height - cursor.y <= minDist) {
        const zone = this.findDropZone1(cont, cursor);
        if (zone && zone.putPlace == 'before' || zone.putPlace == 'after')
          return zone;
      }

      const size = rect.height / 2;
      if (cursor.y <= rect.y + size)
        return {putPlace: 'top', show: {...rect, height: size}, item: relItem};
      else
        return {putPlace: 'bottom', show: {...rect, height: size, y: rect.y + size}, item: relItem};
    } else if (cont.type == 'col') {

      if (cursor.y - rect.y <= minDist) {
        const show = {...rect, height: rect.height / 2};
        if (itemIdx != 0)
          show.y -= show.height / 2;
        return { putPlace: 'before', show, item: relItem };
      } else if (rect.y + rect.height - cursor.y <= minDist) {
        const show = {...rect, y: rect.y + rect.height / 2, height: rect.height / 2};
        if (itemIdx != cont.items.length - 1)
          show.y += show.height / 2;
        return { putPlace: 'after', show, item: relItem }
      } else if (cursor.x - rect.x <= minDist || rect.x + rect.width - cursor.x <= minDist) {
        const zone = this.findDropZone1(cont, cursor);
        if (zone && zone.putPlace == 'before' || zone.putPlace == 'after')
          return zone;
      }

      const size = rect.width / 2;
      if (cursor.x <= rect.x + size)
        return {putPlace: 'left', show: {...rect, width: size}, item: relItem};
      else
        return {putPlace: 'right', show: {...rect, width: size, x: rect.x + size}, item: relItem};
    }
  }

  findDropZone(relItem: LayoutItem | LayoutCont, cursor: Point): DropZone {
    let zone = this.getRootDropZone(cursor);
    if (zone) {
      const putRowInRow = (zone.putPlace == 'left' || zone.putPlace == 'right') && this.layout.type == 'row';
      const putColInCol = (zone.putPlace == 'top' || zone.putPlace == 'bottom') && this.layout.type == 'col';
      if (putRowInRow || putColInCol)
        zone = this.findDropZone1(relItem, cursor);
    } else {
      zone = this.findDropZone1(relItem, cursor);
    }

    const newItem = { id: '?' };
    const res = this.findPutContainer(newItem, zone.item, zone.putPlace);
    if (zone.putPlace == 'before' || zone.putPlace == 'after') {
      const bbox = res.cont.ref.current.getBoundingClientRect();
      const totalSize = res.cont.type == 'row' ? bbox.width : bbox.height;

      let pos = 0;
      res.cont.items.forEach((item, i) => {
        let size = (item.grow || 1) * totalSize / ( res.cont.items.length + 1);
        if (i == res.idx) {
          size = totalSize / ( res.cont.items.length + 1);
          if (res.cont.type == 'row') {
            zone.show.width = size;
            zone.show.x = pos + bbox.left;
          } else {
            zone.show.height = size;
            zone.show.y = pos + bbox.top;
          }
          return;
        }
        pos += size;
      });
    }
    return zone;
  }
}
