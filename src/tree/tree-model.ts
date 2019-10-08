import { Publisher } from 'objio';
import { Item } from '../list-view';
import { string } from 'prop-types';

export interface TreeItem extends Item {
  icon?: JSX.Element;
  children?: Array<TreeItem> | ((parent: TreeItem) => Promise<Array<TreeItem>>);
  open?: boolean;
}

export interface TreeItemHolder extends Item {
  item: TreeItem;
  parent?: TreeItemHolder;
  level: number;
}

interface ModelArgs {
  renderTreeItem(holder: TreeItemHolder): JSX.Element;
}

export function getPath(holder: TreeItemHolder): Array<string> {
  let path = [];
  while (holder) {
    path.push(holder.item.value);
    holder = holder.parent;
  }

  return path.reverse();
}

export class TreeModel extends Publisher {
  private holders = Array<TreeItemHolder>();
  private values = Array<TreeItem>();
  private args: ModelArgs;
  private select = Array<string>();

  constructor(args: ModelArgs) {
    super();
    this.args = args;
  }

  setValues(values: Array<TreeItem>, sel: Array<string>) {
    if (values == this.values && this.select == sel)
      return;

    this.values = values;
    this.select = sel;
    this.holders = this.makeHolders(values, 0, undefined, sel);
    this.delayedNotify();
  }

  open(holder: TreeItemHolder) {
    if (holder.item.open)
      return;

    const i = this.holders.indexOf(holder);
    if (i == -1)
      return;

    const lst = holder.item.children;
    let p: Promise<Array<TreeItem>>;
    if (typeof lst == 'function') {
      p = lst(holder.item);
    } else {
      p = Promise.resolve(lst);
    }

    p.then(children => {
      holder.item.open = true;
      const childrenHolders = this.makeHolders(children, holder.level + 1, holder);
      this.holders.splice(i, 1, holder, ...childrenHolders);
      this.delayedNotify();
    });
  }

  isOpened(holder: TreeItemHolder) {
    return !!holder.item.open;
  }

  isFolder(holder: TreeItemHolder) {
    return !!holder.item.children;
  }

  close(holder: TreeItemHolder) {
    if (!holder.item.open)
      return;

    const i = this.holders.indexOf(holder);
    if (i == -1 || i == this.holders.length - 1)
      return;

    for (let n = i + 1; n < this.holders.length; n++) {
      if (n == this.holders.length - 1) {
        this.holders.splice(i + 1);
        break;
      } else if (this.holders[n].level == holder.level) {
        this.holders.splice(i + 1, n - 1 - i);
        break;
      }
    }
    holder.item.open = false;
    this.delayedNotify();
  }

  private makeHolders(values: Array<TreeItem>, level: number, parent?: TreeItemHolder, sel?: Array<string>): Array<TreeItemHolder> {
    let path = getPath(parent).join('/');
    let holders = Array<TreeItemHolder>();
    for (let n = 0; n < values.length; n++) {
      const v = values[n];
      if (sel && sel[level] == v.value)
        v.open = true;

      const holder: TreeItemHolder = {
        value: path ? path + '/' + v.value : v.value,
        render: this.args.renderTreeItem,
        item: v,

        level,
        parent
      };
      holders.push(holder);
      if (!v.open || !v.children)
        continue;

      if (Array.isArray(v.children)) {
        holders.push(...this.makeHolders(v.children, level + 1, holder, sel));
      } else {
        let place = holders.length;
        v.children(v)
        .then(arr => {
          v.children = arr;
          holders.splice(place, 0, ...this.makeHolders(v.children, level + 1, holder, sel));
          this.delayedNotify();
        });
      }
    }
    return holders;
  }

  getHolders() {
    return this.holders;
  }
}
