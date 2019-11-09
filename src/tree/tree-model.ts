import { Publisher } from 'objio';
import { Item } from '../list-view2';

export type ValuePath = Array<string>;
export type ItemPath = Array<TreeItem>;
export type HolderPath = Array<TreeItemHolder>;

export interface TreeItem extends Item {
  icon?: JSX.Element;
  rightIcons?: JSX.Element;
  children?: Array<TreeItem> | ((parent: TreeItem) => Promise<Array<TreeItem>>) | ((p: TreeItem) => Array<TreeItem>);
  childrenCache?: Array<TreeItem>;

  parent?: TreeItem;
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
  loading?: boolean;
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

export function updateValues(newValues: Array<TreeItem>, prevValues: Array<TreeItem>) {
  let newSet = new Set(newValues.map(v => v.value));
  let prevSet = new Set(prevValues.map(v => v.value));

  for (let n = prevValues.length - 1; n >= 0; n--) {
    const curr = prevValues[n];
    if (!newSet.has(curr.value))
      prevValues.splice(n, 1);  // removed
  }

  let updateArr = Array<{next: TreeItem, prev: TreeItem}>();
  newValues.forEach(next => {
    if (!prevSet.has(next.value)) {
      prevValues.push(next);  // added
      return;
    }
    
    // need to update
    const prev = prevValues.find(prev => prev.value == next.value);
    updateArr.push({ prev, next });
  });

  updateArr.forEach(pair => {
    let prevArr = pair.prev.childrenCache || pair.prev.children;
    let nextArr = pair.next.childrenCache || pair.next.children;
    if (Array.isArray(prevArr) && Array.isArray(nextArr)) {
      updateValues(nextArr, prevArr);
    }

    Object.keys(pair.next)
    .forEach(k => {
      if (k == 'children' || k == 'childrenCache')
        return;

      pair.prev[k] = pair.next[k];
    });
  });
}

export class TreeModel extends Publisher {
  private holders = Array<TreeItemHolder>();
  private values = Array<TreeItem>();
  private args: ModelArgs;

  private selectPath = Array< ValuePath >();
  private selectHolders = Array<TreeItemHolder>();

  constructor(args: ModelArgs) {
    super();
    this.args = args;
  }

  setValues(values: Array<TreeItem>, force?: boolean) {
    if (!force && values == this.values)
      return;

    this.values = values;
    this.selectPath = this.selectPath.slice();
    this.updateHolders();
  
    this.delayedNotify();
  }

  updateHolders(select?: Set<TreeItem>) {
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

  private getHoldersPath(select: Array<ValuePath>): Array<HolderPath> {
    let holdersPath: Array<HolderPath> = select.map(() => []);
    let full = select.length;
    for (let n = 0; n < this.holders.length; n++) {
      const h = this.holders[n];

      for (let i = 0; i < select.length; i++) {
        if (holdersPath[i].length == select[i].length)
          continue;

        const level = holdersPath[i].length;
        if (h.level == level && select[i][level] == h.item.value) {
          holdersPath[i].push(h);
          if (holdersPath[i].length == select[i].length)
            full--;
        }
      }

      if (full <= 0)
        break;
    }

    return holdersPath;
  }

  private updateSelection() {
    this.selectHolders = [];
    this.getHoldersPath(this.selectPath)
    .forEach(path => {
      if (!path.length)
        return;

      const h = path[path.length - 1];
      this.selectHolders.push(h);
    });
  }

  private selectNext(select: ValuePath, holderPath?: Array<TreeItemHolder>, start: number = 0): Promise<void> | void {
    holderPath = holderPath || [];
    let holder: TreeItemHolder;
    const level = holderPath.length;

    for (let n = start; n < this.holders.length; n++) {
      const h = this.holders[n];
      if (h.level == level && select[level] == h.item.value) {
        start = n;
        holder = h;
        break;
      }
    }

    if (!holder)
      return;

    holderPath.push(holder);
    if (holderPath.length >= select.length)
      return;

    const next = () => this.selectNext(select, holderPath, start + 1);
    const p = this.open(holder);
    if (p)
      return p.then(next);

    return next();
  }

  setSelect(sel: Array<ValuePath>) {
    if (sel == this.selectPath)
      return;

    this.selectPath = sel;
    this.selectHolders = [];

    this.selectPath.forEach(path => {
      this.selectNext(path);
    });
    this.updateSelection();
    this.delayedNotify();
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
    holder.loading = false;
    const childrenHolders = this.makeHolders({
      values: children,
      level: holder.level + 1,
      parent: holder
    });
    this.holders.splice(holderIdx, 1, holder, ...childrenHolders);
    this.updateSelection();
    this.delayedNotify();
  }

  open(holder: TreeItemHolder) {
    if (holder.item.open)
      return;

    const i = this.holders.indexOf(holder);
    if (i == -1)
      return;

    const lst = holder.item.childrenCache || holder.item.children;
    if (!lst)
      return;

    let children: Array<TreeItem>;
    if (Array.isArray(lst)) {
      children = lst;
    } else if (typeof lst == 'function') {
      let res = lst(holder.item);
      if (res instanceof Promise) {
        holder.loading = true;
        return res.then(children => this.openImpl(i, children));
      }

      children = res;
    }
    
    this.openImpl(i, children);
  }

  isOpened(holder: TreeItemHolder) {
    return !!holder.item.open;
  }

  isFolder(holder: TreeItemHolder) {
    const childern = holder.item.childrenCache || holder.item.children;
    if (Array.isArray(childern) && childern.length == 0)
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
    this.updateSelection();
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

      let children = (v.childrenCache || v.children) as Array<TreeItem>;
      if (args.select && Array.isArray(children) && children.some(c => args.select.has(c)))
        v.open = true;

      holders.push(holder);
      if (!v.open)
        continue;

      if (!Array.isArray(children) || children.length == 0)
        continue;

      holders.push(...this.makeHolders({
        values: children,
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
