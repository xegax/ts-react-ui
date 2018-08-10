import { Publisher } from '../common/publisher';

export type EventType = 'change' | 'drop';
export type LayoutType = 'row' | 'col';
export type MapType = {[id: string]: JSX.Element};

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

export class LayoutModel extends Publisher<EventType> {
  private map: MapType = {};
  private layout: LayoutCont = { items: [], type: 'row' };
  private lastDrop: LayoutItem;

  getLayout(): LayoutCont {
    return this.layout;
  }

  setLayout(cont: LayoutCont): void {
    this.layout = cont;
    updateParents(this.layout);

    this.delayedNotify({type: 'change'});
    this.delayedNotify();
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
      this.delayedNotify();
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
    this.delayedNotify();
  }
}
