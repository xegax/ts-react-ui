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

  /*if (cont.items.length == 1) {
    const [ item ] = cont.items.splice(0, 1);
    cont.parent.items.push(item);
  }*/

  const i = cont.parent.items.indexOf(cont);
  if (i == -1)
    return;

  cont.parent.items.splice(i, 1);
  removeEmpty(cont.parent);
}

export interface LayoutHandler {
  onDrop?(item: any): LayoutItem | null;
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
    if (!cont)
      console.log(clone(this.layout));

    cont = cont || this.layout;
    const idx = cont.items.findIndex((item: LayoutItem) => item.id == id );
    if (idx != -1) {
      cont.items.splice(idx, 1);
      removeEmpty(cont);
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

  putRelativeTo(newItem: LayoutItem, relItem: LayoutCont | LayoutItem | null, place: PutPlace): boolean {
    let relItemParent: LayoutCont = null;
    let relItemIdx = -1;
    if (relItem) {
      if (!(relItemParent = this.findParent(relItem)))
        return false;

      relItemIdx = relItemParent.items.indexOf(relItem);
      if (relItemIdx == -1)
        return false;
    } else {
      relItem = this.layout;
    }

    // 'before' or 'after' put newItem into the middle
    if (place == 'before') {
      relItemParent.items.splice(relItemIdx, 0, newItem);
    } else if (place == 'after') {
      relItemParent.items.splice(relItemIdx + 1, 0, newItem);
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
        return false;
      }
      
      if (!relItemParent) {
        this.layout = newCont;
      } else {
        if (relItem.grow != null) {
          newCont.grow = relItem.grow;
          delete relItem.grow;
        }
        relItemParent.items.splice(relItemIdx, 1, newCont);
      }
    }

    return true;
  }

  getRootDropZone(cursor: Point, rootRect: ClientRect): DropZone {
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

  findDropZone(item: LayoutItem | LayoutCont, cursor: Point): DropZone {
    let cont = this.findParent(item);
    if (!cont)
      return null;

    const bbox = item.ref.current.getBoundingClientRect();
    const rect = {x: bbox.left, y: bbox.top, width: bbox.width, height: bbox.height};
    const itemIdx = cont.items.indexOf(item);

    const minDist = 20;
    if (cont.type == 'row') {
      if (cursor.x - rect.x <= minDist) {
        const show = {...rect, width: rect.width / 2};
        if (itemIdx != 0)
          show.x -= show.width / 2;
        return { putPlace: 'before', show, item };
      } else if (rect.x + rect.width - cursor.x <= minDist) {
        const show = {...rect, x: rect.x + rect.width / 2, width: rect.width / 2};
        if (itemIdx != cont.items.length - 1)
          show.x += show.width / 2;
        return { putPlace: 'after', show, item };
      } else if (cursor.y - rect.y <= minDist || rect.y + rect.height - cursor.y <= minDist) {
        const zone = this.findDropZone(cont, cursor);
        if (zone && zone.putPlace == 'before' || zone.putPlace == 'after')
          return zone;
      }

      const size = rect.height / 2;
      if (cursor.y <= rect.y + size)
        return {putPlace: 'top', show: {...rect, height: size}, item};
      else
        return {putPlace: 'bottom', show: {...rect, height: size, y: rect.y + size}, item};
    } else if (cont.type == 'col') {

      if (cursor.y - rect.y <= minDist) {
        const show = {...rect, height: rect.height / 2};
        if (itemIdx != 0)
          show.y -= show.height / 2;
        return { putPlace: 'before', show, item };
      } else if (rect.y + rect.height - cursor.y <= minDist) {
        const show = {...rect, y: rect.y + rect.height / 2, height: rect.height / 2};
        if (itemIdx != cont.items.length - 1)
          show.y += show.height / 2;
        return { putPlace: 'after', show, item }
      } else if (cursor.x - rect.x <= minDist || rect.x + rect.width - cursor.x <= minDist) {
        const zone = this.findDropZone(cont, cursor);
        if (zone && zone.putPlace == 'before' || zone.putPlace == 'after')
          return zone;
      }

      const size = rect.width / 2;
      if (cursor.x <= rect.x + size)
        return {putPlace: 'left', show: {...rect, width: size}, item};
      else
        return {putPlace: 'right', show: {...rect, width: size, x: rect.x + size}, item};
    }
  }
}
