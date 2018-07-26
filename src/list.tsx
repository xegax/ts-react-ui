import * as React from 'react';
import { className as cn, clamp } from './common/common';
import { Publisher } from './common/publisher';
import { Scrollbar } from './scrollbar';
import { cancelable, Cancelable } from './common/promise';
import { KeyCode } from './common/keycode';
import './_list.scss';

export type EventType = 'select-row';

const classes = {
  list: 'list-ctrl',
  border: 'list-ctrl-border',
  content: 'list-ctrl-content',
  column: 'list-ctrl-column',
  row: 'list-ctrl-row',
  header: 'list-ctrl-header',
  selRow: 'list-ctrl-selrow',
  cell: 'list-ctrl-cell'
};

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
  render?(args: RenderArgs): JSX.Element | string;
  renderHeader?(jsx: JSX.Element | string, col: ListColumn): JSX.Element;
}

export interface ListModelHandler<T = Object> {
  loadItems(from: number, count: number): Promise<Array<T>>;
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
    this.cancelable = cancelable(this.handler.loadItems(this.loadingRange.from, this.loadingRange.count));
    this.cancelable.then(data => {
      this.cancelable = null;

      this.cacheRange = {
        from: this.loadingRange.from,
        count: data.length
      };
      this.loadingRange = null;
      this.cache = data;
      this.delayedNotify();
    });

    return null;
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
    let newFirst = Math.min(Math.max(0, first), this.itemsCount - this.partVisItems + 1);
    if (newFirst == this.firstSelItem)
      return false;

    this.firstSelItem = newFirst;
    this.delayedNotify();
    return true;
  }
}

export interface Props extends React.HTMLProps<any> {
  width?: number;
  height?: number;
  model: RenderListModel;
  border?: boolean;
}

export interface State {
  model?: RenderListModel;
}

export interface RenderRow {
  column?: ListColumn;
  jsx?: JSX.Element;
  rowIdxAbs: number;
  rowIdxRel: number;
  colIdx: number;
  data: JSX.Element | Object| string;
}

export class List extends React.Component<Props, State> {
  private ctrl: React.RefObject<HTMLDivElement> = React.createRef();

  constructor(props: Props) {
    super(props);

    this.state = {
      model: props.model
    };
  }

  subscriber = () => {
    this.setState({});
  };

  componentDidMount() {
    this.state.model.subscribe(this.subscriber);
    this.state.model.setHeight(this.props.height);
  }

  componentWillUnmount() {
    this.state.model.unsubscribe(this.subscriber);
  }

  renderHeader(col: ListColumn): JSX.Element {
    const model = this.state.model;
    const height = model.getHeaderSize();
    let row: JSX.Element | string = col.name;
    if (col.renderHeader)
      row = col.renderHeader(row, col);
    
    row = (
      <div className={classes.cell}>
        {row}
      </div>
    );

    row = (
      <div
        className={classes.header}
        key={'hdr-' + col.name}
        style={{height, lineHeight: height + 'px'}}>
          {row}
      </div>
    );

    return row;
  }

  renderRow(args: RenderRow): JSX.Element {
    const model = this.state.model;
    const height = model.getItemHeight();
    let row: JSX.Element | Object | string = args.data || '...';
    if (row instanceof Object)
      row = row.toString();
    
    if (args.column && args.data && args.column.render)
      row = args.column.render({
        item: args.data,
        column: args.column,
        rowIdx: args.rowIdxAbs,
        colIdx: args.colIdx
      });

    if (args.column && args.column.width != -1)
      row = (
        <div className={classes.cell}>
          {row}
        </div>
      );

    const className = cn(classes.row, model.isSelect(args.rowIdxAbs) && classes.selRow);
    return (
      <div
        onClick={event => {
          model.setSelRow(args.rowIdxAbs, event.ctrlKey, event.shiftKey);
        }}
        className={className}
        key={args.rowIdxRel}
        style={{height}}>
          {row}
      </div>
    );
  }

  renderRows(): JSX.Element {
    const model = this.state.model;
    let arr = Array<Object>();
    if (model.getItemsCount() > 0)
      arr = model.getItems(model.getSelectFirst(), model.getVisibleCount());
    const columns = model.getColumns();

    let cols = Array<JSX.Element>();
    for (let c = 0; c < Math.max(1, columns.length); c++) {
      const column: ListColumn = columns[c];

      let rows = Array<JSX.Element>();
      if (column && model.getHeaderSize()) {
        rows.push(this.renderHeader(column));
      }

      for (let n = 0; n < model.getVisibleCount(); n++) {
        let data = arr ? arr[n] : null;

        rows.push(this.renderRow({
          column,
          data,
          colIdx: c,
          rowIdxRel: n,
          rowIdxAbs: n + model.getSelectFirst()
        }));
      }

      let colStyle: React.CSSProperties = {};

      if (column && column.width) {
        if (column.width != -1)
          colStyle.width = column.width;
        colStyle.flexGrow = 0;
      }

      cols.push(
        <div
          className={classes.column}
          key={'col-' + c}
          style={colStyle}
        >
          {rows}
        </div>
      );
    }

    return (
      <div className={classes.content}>
        {cols}
      </div>
    );
  }

  componentWillReceiveProps(props: Props) {
    if (props.height != this.state.model.getHeight())
      this.state.model.setHeight(props.height);

    if (props.width != this.state.model.getWidth())
      this.state.model.setWidth(props.width);
  }

  onKeyDown = (event: React.KeyboardEvent<any>) => {
    if (this.ctrl.current != document.activeElement)
      return;

    const model = this.props.model;
    event.preventDefault();
    event.stopPropagation();

    const selRow = model.getSelRow();
    const selFirst = model.getSelectFirst();

    let dir = 0;
    if (event.keyCode == KeyCode.ARROW_UP) {
      dir = -1;
    } else if (event.keyCode == KeyCode.ARROW_DOWN) {
      dir = 1;
    }

    if (dir) {
      if (model.getSelType() == 'none')
        model.setSelectFirst(selFirst + dir);
      else
        model.setSelRow(selRow + dir);
    }

    this.props.onKeyDown && this.props.onKeyDown(event);
  }

  onWheel = (event: React.WheelEvent<any>) => {
    event.preventDefault();
    event.stopPropagation();
  
    let first = this.props.model.getSelectFirst();
    if (event.deltaY < 0)
      first -= 1;
    else
      first += 1;

    this.props.model.setSelectFirst(first);
  }

  render() {
    const {width, height, model} = this.props;
    return (
      <div
        ref={this.ctrl}
        tabIndex={1}
        className={cn(classes.list, this.props.border && classes.border)}
        style={{width, height}}
        onKeyDown={this.onKeyDown}
        onWheel={this.onWheel}
      >
        {this.renderRows()}
        <Scrollbar
          itemsCount = {model.getItemsCount()}
          itemHeight = {model.getItemHeight()}
          itemsHeight = {height - model.getHeaderSize()}
          height = {height}
          firstItem = {model.getSelectFirst()}
          setSelectFirst = {first => model.setSelectFirst(first)}
        />
      </div>
    );
  }
}