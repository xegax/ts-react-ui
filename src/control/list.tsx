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
export interface Column {
  name: string;
  width?: number;
  render: (row: Object, col: Column) => JSX.Element | string;
}

export class ListModel<T = Object> extends Publisher<EventType> {
  protected itemsCount: number = 0;
  private cacheRange: Range = null;
  private loadingRange: Range = null; // null = nothing is loading
  private cache = Array<T>();
  private cancelable: Cancelable;
  private columns = Array<Column>();

  private loader: Loader<T> = () => {
    throw 'loadItems not implemented';
  };

  constructor(count: number) {
    super();
    this.itemsCount = count;
  }

  setColumns(columns: Array<Column>) {
    if (JSON.stringify(columns) == JSON.stringify(this.columns))
      return;

    this.columns = columns;
    this.delayedNotify();
  }

  getColumns(): Array<Column> {
    return this.columns;
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
    this.cancelable.promise.then(data => {
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

  setLoader(loader: Loader<T>) {
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

  constructor(count: number, itemSize: number = 50) {
    super(count);
    this.itemSize = itemSize;
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
    const visItems = this.size / this.itemSize;
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
  column?: Column;
  jsx?: JSX.Element;
  rowIdxAbs: number;
  rowIdxRel: number;
  colIdx: number;
  data: Object;
}

export class List extends React.Component<Props, State> {
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

  renderRow(args: RenderRow): RenderRow {
    const model = this.state.model;
    const height = model.getItemSize();
    let row: JSX.Element | string = (args.data || '?').toString();
    
    if (args.column && args.data)
      row = args.column.render(args.data, args.column);

    if (args.column && args.column.width != -1)
      row = (
        <div className={classes.cell}>
          {row}
        </div>
      );

    const className = cn(classes.row, model.getSelRow() == args.rowIdxAbs && classes.selRow);
    args.jsx = (
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

    return args;
  }

  renderRows(): JSX.Element {
    const model = this.state.model;
    let arr = Array<Object>();
    if (model.getItemsCount() > 0)
      arr = model.getItems(model.getSelectFirst(), model.getVisibleCount());
    const columns = model.getColumns();

    let cols = Array<JSX.Element>();
    for (let c = 0; c < Math.max(1, columns.length); c++) {
      const column: Column = columns[c];

      let rows = Array<JSX.Element>();
      for (let n = 0; n < model.getVisibleCount(); n++) {
        let data: Object = arr ? arr[n] : null;

        const args = this.renderRow({
          column,
          data,
          colIdx: c,
          rowIdxRel: n,
          rowIdxAbs: n + model.getSelectFirst()
        });
        rows.push(args.jsx);
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
    this.state.model.setSize(props.height);
  }

  onKeyDown = (event: React.KeyboardEvent<any>) => {
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
          firstItem = {model.getSelectFirst()}
          setSelectFirst={first => model.setSelectFirst(first)}
        />
      </div>
    );
  }
}