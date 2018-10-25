import { Publisher } from 'objio/common/publisher';
import { ExtPromise, Cancelable } from 'objio/common/ext-promise';
import { clamp } from '../common/common';

export interface List2Item {
  id: string;
}

export interface Handler<T extends List2Item = List2Item> {
  loadNext(from: number, count: number): Promise<Array<T>>;
  render(item: T, idx: number): JSX.Element | string;
}

export type EventType = 'select';
export type SelectType = 'single-select' | 'multi-select' | 'none';

export class List2Model<T extends List2Item = List2Item> extends Publisher<EventType> {
  private items = Array<T>();
  private handler: Handler<T>;
  private itemsPerLoad = 100;
  private dataId: number = 0;
  private loading: Cancelable<Array<T>>;
  private selection = new Set<string>();
  private selectable: SelectType = 'single-select';
  private focusItem: number = -1;
  private focusable: boolean = true;
  private selectOnFocus: boolean = true;

  setFocusable(able: boolean): boolean {
    if (this.focusable == able)
      return false;

    this.focusable = able;
    this.delayedNotify();
    return true;
  }

  getFocusable(): boolean {
    return this.focusable;
  }

  setFocus(idx: number): boolean {
    idx = clamp(idx, [0, this.items.length - 1]);
    if (!this.focusable || idx == this.focusItem)
      return false;

    this.focusItem = idx;
    if (this.selectOnFocus)
      this.setSelect({ id: this.items[idx].id, clear: true });

    this.delayedNotify();
    return true;
  }

  getFocus(): number {
    return this.focusItem;
  }

  setSelectable(type: SelectType): boolean {
    if (type == this.selectable)
      return false;

    this.selectable = type;
    return true;
  }

  setSelect(args: { id: string, clear?: boolean}): boolean {
    if (this.selectable == 'none' || !args || !('id' in args))
      return false;

    if (args.clear)
      this.selection.clear();

    if (!args.clear && this.selection.has(args.id)) {
      this.selection.delete(args.id);
    } else {
      if (this.selectable == 'single-select')
        this.selection.clear();

      this.selection.add(args.id);  
    }

    this.delayedNotify({ type: 'select' });
    return true;
  }

  clearSelect(): boolean {
    if (!this.selection.size)
      return false;
    
    this.selection.clear();
    this.delayedNotify({ type: 'select' });
    return true;
  }

  isSelected(id: string): boolean {
    return this.selection.has(id);
  }

  getSelectedIds(): Array<string> {
    let arr = Array<string>();
    this.selection.forEach(id => {
      arr.push(id);
    });
    return arr;
  }

  getItemsPerLoad(): number {
    return this.itemsPerLoad;
  }

  setItemsPerLoad(count: number): void {
    this.itemsPerLoad = count;
  }

  getCount(): number {
    return this.items.length;
  }

  getItems(): Array<T> {
    return this.items;
  }

  getDataId(): number {
    return this.dataId;
  }

  clear(args?: { reload?: boolean }): Promise<any> {
    args = args || { reload: true };

    if (this.loading) {
      this.loading.cancel();
      this.loading = null;
    }

    this.items = [];
    this.dataId++;
    if (args.reload)
      return this.loadNext();

    this.delayedNotify();
    return Promise.resolve();
  }

  append(items: Array<T>): Array<T> {
    this.items.push(...items);
    this.delayedNotify();

    return items;
  }

  setHandler(handler: Handler<T>): void {
    this.handler = handler;
  }

  getHandler(): Handler<T> {
    return this.handler;
  }

  loadNext(): Promise<Array<T>> {
    if (!this.handler)
      return Promise.reject('not defined');

    if (this.loading)
      return this.loading;

    this.loading = (
      ExtPromise<Array<T>>()
      .cancelable(this.handler.loadNext(this.items.length, this.itemsPerLoad) )
    );

    return (
      this.loading
      .then(res => {
        this.loading = null;
        return this.append(res);
      })
    );
  }

  render(item: T, idx: number): JSX.Element | string {
    if (!this.handler)
      return typeof item == 'string' ? item : JSON.stringify(item);

    return this.handler.render(item, idx);
  }
}
