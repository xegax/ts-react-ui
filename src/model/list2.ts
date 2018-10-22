import { Publisher } from 'objio/common/publisher';
import { ExtPromise, Cancelable } from 'objio/common/ext-promise';

export interface Handler<T extends Object = Object> {
  loadNext(from: number, count: number): Promise<Array<T>>;
  render(item: T, idx: number): JSX.Element | string;
}

export class List2Model<T extends Object = Object> extends Publisher {
  private items = Array<T>();
  private handler: Handler<T>;
  private itemsPerLoad = 100;
  private dataId: number = 0;
  private loading: Cancelable<Array<T>>;

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
