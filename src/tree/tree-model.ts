import { Publisher } from 'objio';
import { Item } from '../list-view2';

export type ValuePath = Array<string>;
export type ItemPath = Array<TreeItem>;
export type HolderPath = Array<TreeItemHolder>;

export interface TreeItem extends Item {
  icon?: JSX.Element;
  children?: Array<TreeItem> | ((parent: TreeItem) => Promise<Array<TreeItem>>);
  open?: boolean;
  droppable?: boolean;  // default true
  draggable?: boolean;  // default true
}

interface MakeHoldersArgs {
  values: Array<TreeItem>;
  level: number;
  parent?: TreeItemHolder;
  select?: Set<TreeItem>;
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

  private selectPath = Array< ValuePath >();
  private holderPath = Array< HolderPath >();

  private selectHolders = Array<TreeItemHolder>();
  private holdersMap: {[level: number]: { [value: string]: TreeItemHolder }} = {};

  constructor(args: ModelArgs) {
    super();
    this.args = args;
  }

  setValues(values: Array<TreeItem>, force?: boolean) {
    if (!force && values == this.values)
      return;

    this.values = values;
    this.updateHolders();
  
    this.delayedNotify();
  }

  updateHolders(select?: Set<TreeItem>) {
    this.holdersMap = {};
    this.holders = this.makeHolders({
      values: this.values,
      level: 0,
      select
    });

    if (select) {
      this.selectHolders = [];
      for (let n = 0; n < this.holders.length; n++) {
        const holder = this.holders[n];
        if (select.has(holder.item))
          this.selectHolders.push(holder);
      }
    }

    this.delayedNotify();
  }

  private selectNext(select: ValuePath, holderPath: Array<TreeItemHolder>, level: number): Promise<void> | void {
    const levelMap = this.holdersMap[level];
    if (!levelMap)
      return;

    const value = select[level];
    const holder = levelMap[value];
    if (!holder)
      return;

    holderPath.push(holder);
    if (level + 1 >= select.length)
      return;

    const next = () => this.selectNext(select, holderPath, level + 1);
    const p = this.open(holder);
    if (p)
      return p.then(next);

    return next();
  }

  setSelect(sel: Array<ValuePath>) {
    if (sel == this.selectPath)
      return;

    this.holderPath = [];
    this.selectPath = sel;
    this.selectHolders = [];

    this.selectPath.forEach(path => {
      const holderPath = Array<TreeItemHolder>();
      this.holderPath.push(holderPath);

      const next = () => {
        if (holderPath.length)
          this.selectHolders.push(holderPath[holderPath.length - 1]);
        this.delayedNotify();
      };

      let p = this.selectNext(path, holderPath, 0);
      if (p)
        p.then(next);
      else
        next();
    });
  }

  getPathByHolder(holder: TreeItemHolder): ItemPath {
    let path = Array<TreeItem>();
    while(holder) {
      path.push(holder.item);
      holder = holder.parent;
    }
    return path.reverse();
  }

  getSelectHolders() {
    return this.selectHolders;
  }

  private openImpl(holderIdx: number, children: Array<TreeItem>) {
    const holder = this.holders[holderIdx];
    holder.item.open = true;
    const childrenHolders = this.makeHolders({
      values: children,
      level: holder.level + 1,
      parent: holder
    });
    this.holders.splice(holderIdx, 1, holder, ...childrenHolders);
    this.delayedNotify();
  }

  open(holder: TreeItemHolder) {
    if (holder.item.open)
      return;

    const i = this.holders.indexOf(holder);
    if (i == -1)
      return;

    const lst = holder.item.children;
    if (!lst)
      return;

    if (typeof lst == 'function') {
      return (
        lst(holder.item)
        .then(children => this.openImpl(i, children))
      );
    }
    
    this.openImpl(i, lst);
  }

  isOpened(holder: TreeItemHolder) {
    return !!holder.item.open;
  }

  isFolder(holder: TreeItemHolder) {
    if (Array.isArray(holder.item.children) && holder.item.children.length == 0)
      return false;

    return !!holder.item.children;
  }

  close(holder: TreeItemHolder) {
    if (!holder.item.open)
      return;

    const i = this.holders.indexOf(holder);
    if (i == -1 || i == this.holders.length - 1)
      return;

    for (let n = i + 1; n < this.holders.length; n++) {
      if (this.holders[n].level <= holder.level) {
        this.holders.splice(i + 1, n - 1 - i);
        break;
      } else if (n == this.holders.length - 1) {
        this.holders.splice(i + 1);
        break;
      }
    }
    holder.item.open = false;
    this.delayedNotify();
  }

  private makeHolders(args: MakeHoldersArgs): Array<TreeItemHolder> {
    let path = getPath(args.parent).join('/');
    let holders = Array<TreeItemHolder>();
    for (let n = 0; n < args.values.length; n++) {
      const v = args.values[n];
      const value = path ? path + '/' + v.value : v.value;

      const holder: TreeItemHolder = {
        value,
        render: this.args.renderTreeItem,
        item: v,
        title: v.title,

        level: args.level,
        parent: args.parent
      };

      if (args.select && Array.isArray(v.children) && v.children.some(c => args.select.has(c)))
        v.open = true;

      const map = this.holdersMap[args.level] || (this.holdersMap[args.level] = {});
      map[v.value] = holder;

      holders.push(holder);
      if (!v.open || !v.children || !Array.isArray(v.children))
        continue;

      holders.push(...this.makeHolders({
        values: v.children,
        level: args.level + 1,
        parent: holder,
        select: args.select
      }));
    }
    return holders;
  }

  getHolders() {
    return this.holders;
  }
}
