import { Publisher } from 'objio/common/publisher';
import { clamp } from '../common/common';

export type List2ItemData = { label?: string | JSX.Element } | string;
export interface List2Item<T = List2ItemData> {
  id: string;
  label?: string;
  data: T;
}

export interface Handler<T> {
  loadNext(from: number, count: number): Promise< Array<List2Item<T>> >;
  render(item: List2Item<T>, idx: number): JSX.Element | string;
}

export type EventType = 'select';
export type SelectType = 'single-select' | 'multi-select' | 'none';

export class List2Model<T = Object, TEventType = string> extends Publisher<EventType | TEventType> {
  protected items = Array<List2Item<T>>();
  protected handler: Handler<T>;
  protected itemsPerLoad = 100;
  protected dataId: number = 0;
  protected loading: Promise<Array< List2Item<T> >>;
  protected selection = new Array<List2Item<T>>();
  protected selectable: SelectType = 'single-select';
  protected focusItem: number = -1;
  protected focusable: boolean = true;
  protected selectOnFocus: boolean = true;

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

  getFocusItem(): List2Item {
    return this.items[this.focusItem];
  }

  setSelectable(type: SelectType): boolean {
    if (type == this.selectable)
      return false;

    this.selectable = type;
    return true;
  }

  setSelect(args: { id: string, clear?: boolean, notify?: boolean}): boolean {
    if (this.selectable == 'none' || !args || !('id' in args))
      return false;

    if (args.clear)
      this.selection = [];

    if (!args.clear && this.selection.find(item => item.id == args.id)) {
      this.selection = this.selection.filter(item => item.id != args.id);
    } else {
      if (this.selectable == 'single-select')
        this.selection = [];

      const item = this.items.find(item => item.id == args.id);
      if (item)
        this.selection.push(item);
      else
        return false;
    }

    if (args.notify != false)
      this.delayedNotify({ type: 'select' });

    return true;
  }

  clearSelect(): boolean {
    if (!this.selection.length)
      return false;
    
    this.selection = [];
    this.delayedNotify({ type: 'select' });
    return true;
  }

  isSelected(id: string): boolean {
    return this.selection.find(item => item.id == id) != null;
  }

  getSelectedIds(): Array<string> {
    return this.selection.map(item => item.id);
  }

  getSelectedItems(): Array<List2Item<T>> {
    return this.selection.slice();
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

  getItems(): Array< List2Item<T> > {
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

  append(items: Array< List2Item<T> >): Array< List2Item<T> > {
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

  loadNext(): Promise<Array< List2Item<T> >> {
    if (!this.handler)
      return Promise.reject('not defined');

    if (this.loading)
      return this.loading;

    this.loading = this.handler.loadNext(this.items.length, this.itemsPerLoad);
    return (
      this.loading
      .then(res => {
        this.loading = null;
        return this.append(res);
      })
    );
  }

  render(item: List2Item<T>, idx: number): JSX.Element | string {
    if (!this.handler.render) {
      if (item.label)
        return item.label;

      return typeof item.data == 'string' ? item.data : JSON.stringify(item.data);
    }

    return this.handler.render(item, idx);
  }
}
