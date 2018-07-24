import * as React from 'react';
import { className as cn, clamp } from '../common/common';
import { Publisher } from '../common/publisher';
import { Scrollbar } from './scrollbar';
import { cancelable, Cancelable } from '../common/promise';
import { KeyCode } from '../common/keycode';
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

type Loader<T> = (from: number, count: number) => Promise<Array<T>>;

export interface RenderArgs<TRow = Object, TColumn extends ListColumn = ListColumn> {
  item: TRow;
  column: TColumn;
  idx: number;
}

export interface ListColumn {
  name: string;
  width?: number;
  render?(args: RenderArgs): JSX.Element | string;
  renderHeader?(jsx: JSX.Element | string, col: ListColumn): JSX.Element;
}

export class ListModel<T = Object> extends Publisher<EventType> {
  protected itemsCount: number = 0;
  private cacheRange: Range = null;
  private loadingRange: Range = null; // null = nothing is loading
  private cache = Array<T>();
  private cancelable: Cancelable;
  protected columns = Array<ListColumn>();

  private loader: Loader<T> = () => {
    throw 'loadItems not implemented';
  };

  constructor(count: number) {
    super();
    this.itemsCount = count;
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

    const HALF_ITEMS_PER_LOAD = 500;
    this.cacheRange = null;
    this.loadingRange = {
      from: Math.max(0, from - HALF_ITEMS_PER_LOAD),
      count: Math.min(HALF_ITEMS_PER_LOAD * 2, this.itemsCount)
    };

    if (this.cancelable)
      this.cancelable.cancel();

    console.log('loading', JSON.stringify(this.loadingRange));
    this.cancelable = cancelable(this.loader(this.loadingRange.from, this.loadingRange.count));
    this.cancelable.then(data => {
      this.cancelable = null;

      this.cacheRange = {
        from: this.loadingRange.from,
        count: data.length
      };
      this.loadingRange = null;
      this.cache = data;
      this.notify();
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

  setLoader(loader: Loader<T>): void {
    this.loader = loader;
  }
}

export class RenderListModel extends ListModel {
  protected firstSelItem: number = 0;
  protected fullVisItems: number = 0;
  protected partVisItems: number = 0;
  private size: number = 0;
  private itemSize: number = 50;
  private selRow: number = -1;
  private headerSize: number = 25;
  private header: boolean = true;

  constructor(count: number, itemSize: number = 50) {
    super(count);
    this.itemSize = itemSize;
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
    this.setSize(this.size);
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

  setSelRow(row: number): void {
    let newRow = clamp(row, [0, this.itemsCount - 1]);
    if (this.selRow == newRow)
      return;

    if (newRow < this.firstSelItem)
      this.firstSelItem = newRow;
    else if (newRow >= this.firstSelItem + this.fullVisItems - 1)
      this.firstSelItem = Math.max(0, newRow - this.fullVisItems + 1);

    this.selRow = newRow;
    this.delayedNotify({type: 'select-row'});
  }

  getItemSize(): number {
    return this.itemSize;
  }

  setSize(size: number): void {
    this.size = size;
    const visItems = (this.size - this.getHeaderSize()) / this.itemSize;
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

    this.notify();
  }

  getSize(): number {
    return this.size;
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
    this.notify();
    return true;
  }
}

interface Props {
  width?: number;
  height?: number;
  model: RenderListModel;
  border?: boolean;
}

interface State {
  model?: RenderListModel;
}

interface RenderRow {
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
    this.state.model.setSize(this.props.height);
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

  renderRow(args: RenderRow) {
    const model = this.state.model;
    const height = model.getItemSize();
    let row: JSX.Element | Object | string = args.data || '...';
    
    if (args.column && args.data && args.column.render)
      row = args.column.render({item: args.data, column: args.column, idx: args.rowIdxAbs});

    if (args.column && args.column.width != -1)
      row = (
        <div className={classes.cell}>
          {row}
        </div>
      );

    const className = cn(classes.row, model.getSelRow() == args.rowIdxAbs && classes.selRow);
    return (
      <div
        onClick={() => {
          model.setSelRow(args.rowIdxAbs);
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
    if (props.height != this.state.model.getSize())
      this.state.model.setSize(props.height);
  }

  onKeyDown = (event: React.KeyboardEvent<any>) => {
    if (this.ctrl.current != document.activeElement)
      return;

    event.preventDefault();
    event.stopPropagation();

    if (event.keyCode == KeyCode.ARROW_UP) {
      this.props.model.setSelRow(this.props.model.getSelRow() - 1);
    } else if (event.keyCode == KeyCode.ARROW_DOWN) {
      this.props.model.setSelRow(this.props.model.getSelRow() + 1);
    }
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
          itemHeight = {model.getItemSize()}
          height={height}
          itemsHeight={height - model.getHeaderSize()}
          firstItem = {model.getSelectFirst()}
          setSelectFirst={first => model.setSelectFirst(first)}
        />
      </div>
    );
  }
}