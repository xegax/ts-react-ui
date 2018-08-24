import { Publisher } from 'objio/common/publisher';
import { Cancelable, cancelable } from '../common/promise';
import { clamp } from '../common/common';

export type EventType = 'select-row';

export interface Range {
  from: number;
  count: number;
}

function inRange(tgt: Range, src: Range): boolean {
  return tgt.from >= src.from && tgt.from + tgt.count <= src.from + src.count;
}

export interface RenderArgs<TRow = Object, TColumn extends ListColumn = ListColumn> {
  item: TRow;
  column: TColumn;
  rowIdx: number;
  colIdx: number;
}

export interface ListColumn {
  name: string;
  width?: number;
  grow?: number;
  render?(args: RenderArgs): JSX.Element | string;
  renderHeader?(jsx: JSX.Element | string, col: ListColumn): JSX.Element;
}

export interface ListModelHandler<T = Object> {
  loadItems(from: number, count: number): Promise<Array<T>> | Array<T>;
  renderItem?(jsx: JSX.Element): JSX.Element;
  getItemID?(item: T): string;
}

export class ListModel<T = Object> extends Publisher<EventType> {
  protected itemsCount: number = 0;
  private cacheRange: Range = null;
  private loadingRange: Range = null; // null = nothing is loading
  protected cache = Array<T>();
  private cancelable: Cancelable<Array<T>>;
  protected columns = Array<ListColumn>();
  private bufferSize: number = 1000;

  protected handler: ListModelHandler<T>;

  constructor(count: number) {
    super();
    this.itemsCount = count;
  }

  clearCache(notify?: boolean): void {
    this.cache = [];
    this.cacheRange = null;

    notify && this.delayedNotify();
  }

  setBufferSize(size: number): void {
    this.bufferSize = size;
  }

  getBufferSize(): number {
    return this.bufferSize;
  }

  setColumns(columns: Array<ListColumn>) {
    if (JSON.stringify(columns) == JSON.stringify(this.columns))
      return;

    this.columns = columns;
    this.delayedNotify();
  }

  getColumns(): Array<ListColumn> {
    return this.columns;
  }

  reload(): void {
    this.cache = [];
    this.cacheRange = null;
    this.delayedNotify();
  }

  getItems(from: number, count: number): Array<T> | null {
    if (count == 0)
      return null;

    if (this.cacheRange && inRange({from, count}, this.cacheRange))
      return this.cache.slice(from - this.cacheRange.from, from - this.cacheRange.from + count);

    if (this.loadingRange && inRange({ from, count }, this.loadingRange))
      return null;  // we don't have loaded yet

    const HALF_ITEMS_PER_LOAD = Math.ceil(this.bufferSize / 2);
    this.cacheRange = null;

    const loadingFrom = Math.max(0, from - HALF_ITEMS_PER_LOAD);
    const loadingCount = Math.min(loadingFrom + HALF_ITEMS_PER_LOAD * 2, this.itemsCount) - loadingFrom;

    this.loadingRange = {
      from: loadingFrom,
      count: loadingCount
    };

    if (this.cancelable)
      this.cancelable.cancel();

    console.log('loading', JSON.stringify(this.loadingRange));
    const task = this.handler.loadItems(this.loadingRange.from, this.loadingRange.count);
    const updateData = (data => {
      this.cancelable = null;

      this.cacheRange = {
        from: this.loadingRange.from,
        count: data.length
      };
      this.loadingRange = null;
      this.cache = data;
      this.delayedNotify();
    });

    if (task instanceof Promise) {
      this.cancelable = cancelable(task);
      this.cancelable.then(updateData);
      return null;
    }

    updateData(task);
    return this.cache.slice(from - this.cacheRange.from, from - this.cacheRange.from + count);
  }

  setItemsCount(count: number): void {
    if (count == this.itemsCount)
      return;

    this.itemsCount = count;
    this.delayedNotify();
  }

  getItemsCount(): number {
    return this.itemsCount;
  }

  setHandler(handler: ListModelHandler<T>): void {
    this.handler = handler;
  }
}

export type SelType = 'none' | 'multi' | 'single';
export class RenderListModel extends ListModel {
  protected firstSelItem: number = 0;
  protected fullVisItems: number = 0;
  protected partVisItems: number = 0;
  private height: number = 0;
  private width: number = 0;
  private itemSize: number = 20;
  private selRow: number = -1;
  private headerSize: number = 25;
  private header: boolean = true;
  private sel: Set<string> = new Set();
  private selType: SelType = 'multi';

  constructor(count: number, itemSize?: number) {
    super(count);
    this.itemSize = itemSize || this.itemSize;
  }

  getItemID(itemIdx: number): string {
    let id = '' + itemIdx;
    if (this.handler.getItemID)
      id = this.handler.getItemID(this.cache[itemIdx - this.firstSelItem]);
    return id;
  }

  isSelect(itemIdx: number): boolean {
    return this.sel.has(this.getItemID(itemIdx));
  }

  clearSel(): void {
    this.sel.clear();
    this.delayedNotify();
  }

  getSel(): Array<string> {
    return Array.from(this.sel.values());
  }

  setSelType(type: SelType): void {
    this.selType = type;
    if (this.selType == 'single' && this.sel.size > 1) {
      const selRow = this.selRow;
      this.selRow = -1;
      this.setSelRow(selRow);
    }
  }

  getSelType(): SelType {
    return this.selType;
  }

  getSelCount(): number {
    return this.sel.size;
  }

  setItemsCount(count: number): void {
    super.setItemsCount(count);
    this.setHeight(this.height);
  }

  getHeaderSize(): number {
    if (!this.header || this.columns.length == 0)
      return 0;

    return this.headerSize;
  }

  setHeaderSize(size: number): void {
    if (this.headerSize == size)
      return;

    this.headerSize = size;
    this.setHeight(this.height);
  }

  setHeader(hdr: boolean): void {
    this.header = hdr;
    this.delayedNotify();
  }

  getHeader(): boolean {
    return this.header;
  }

  getSelRow(): number {
    return this.selRow;
  }

  setSelRow(row: number, ctrl?: boolean, shift?: boolean): void {
    let newRow = clamp(row, [0, this.itemsCount - 1]);
    const alreadySelect = this.isSelect(row);
    if (!(alreadySelect && ctrl) && this.selRow == newRow)
      return;

    if (newRow < this.firstSelItem)
      this.firstSelItem = newRow;
    else if (newRow >= this.firstSelItem + this.fullVisItems - 1)
      this.firstSelItem = Math.max(0, newRow - this.fullVisItems + 1);

    if (!ctrl || this.selType == 'single')
      this.sel.clear();

    const id = this.getItemID(row);
    if (this.selType != 'none') {
      if (ctrl && alreadySelect)
        this.sel.delete(id);
      else {
        if (shift && this.selType == 'multi') {
          for (let n = Math.min(this.selRow, newRow); n < Math.max(this.selRow, newRow); n++)
            this.sel.add(this.getItemID(n));
        } else {
          this.sel.add(id);
        }
      }
    }

    this.selRow = newRow;
    this.delayedNotify({type: 'select-row'});
  }

  getItemHeight(): number {
    return this.itemSize;
  }

  setWidth(size: number): void {
    this.width = size;
  }

  getWidth(): number {
    return this.width;
  }

  setHeight(size: number): void {
    this.height = size;
    const visItems = (this.height - this.getHeaderSize()) / this.itemSize;
    this.fullVisItems = Math.floor(visItems);
    this.partVisItems = Math.ceil(visItems);

    if (this.partVisItems >= this.itemsCount) {
      this.firstSelItem = 0;
    } else {
      const selCount = Math.min(this.itemsCount, this.firstSelItem + this.partVisItems) - this.firstSelItem;
      const diff = selCount - this.fullVisItems;
      if (diff < 0)
        this.firstSelItem = Math.max(0, this.itemsCount - this.fullVisItems);
    }

    this.delayedNotify();
  }

  getHeight(): number {
    return this.height;
  }

  getSelectFirst(): number {
    return this.firstSelItem;
  }

  getVisibleCount(): number {
    return Math.min(this.itemsCount, this.firstSelItem + this.partVisItems) - this.firstSelItem;
  }

  getFullVisibleCount(): number {
    return this.fullVisItems;
  }

  setSelectFirst(first: number): boolean {
    if (this.itemsCount < this.partVisItems)
      return false;

    const min = 0;
    const max = this.itemsCount - this.partVisItems + 1;
    let newFirst = clamp(first, [min, max]);
    if (newFirst == this.firstSelItem)
      return false;

    this.firstSelItem = newFirst;
    this.delayedNotify();
    return true;
  }
}
