import { Publisher } from '../common/publisher';

export type LayoutType = 'row' | 'col';
export type MapType = {[id: string]: JSX.Element};

export interface LayoutItem {
  id: string;
  grow?: number;
  ref?: React.RefObject<HTMLDivElement>;
}

export interface LayoutCont {
  items: Array<LayoutCont | LayoutItem>;
  type: LayoutType;
  grow?: number;
  ref?: React.RefObject<HTMLDivElement>;
}

export class LayoutModel extends Publisher {
  private map: MapType = {};
  private layout: LayoutCont = { items: [], type: 'row' };

  getLayout(): LayoutCont {
    return this.layout;
  }

  setLayout(cont: LayoutCont): void {
    this.layout = cont;
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
}
