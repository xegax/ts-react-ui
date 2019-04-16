import * as React from 'react';
import {
  Grid,
  CellProps,
  HeaderProps,
  ScrollParams,
  RowsRange
} from './grid';
import { Publisher } from 'objio';

export interface CellPropsExt extends CellProps {
  data: string;
}

export {
  HeaderProps
}

export interface Props {
  rowsCount: number;
  colsCount: number;
  loader?: Loader;
  bodyBorder?: boolean;
  headerBorder?: boolean;

  renderCell(props: CellPropsExt): React.ReactChild;
  renderHeader(props: HeaderProps): React.ReactChild;
}

interface State {
  model: GridModel;
}

export class GridLoadable extends React.Component<Props, State> {
  private ref = React.createRef<Grid>();

  constructor(props: Props) {
    super(props);

    this.state = {
      model: new GridModel({
        rowsCount: props.rowsCount,
        colsCount: props.colsCount,
        loader: props.loader
      })
    };

    this.state.model.subscribe(this.onLoad);
  }

  getModel() {
    return this.state.model;
  }

  onLoad = () => {
    this.setState({});
    this.ref.current.ref.current.recomputeGridSize();
  };

  componentDidMount() {
    this.state.model.loadNext();
  }

  onScroll = (params: ScrollParams) => {
    // this.ref.current.ref.current;
    const diff = Math.round(params.scrollHeight - (params.scrollTop + params.clientHeight));
    if (diff <= 0)
      this.state.model.loadNext();
  };

  renderCell = (props: CellProps) => {
    const { cells, bunchIdx } = this.state.model.getCells(props.row);
    const bunch = this.state.model.getBunch(bunchIdx);
    if (!bunch)
      this.state.model.reloadBunch({ bunchIdx });

    return this.props.renderCell({
      row: props.row,
      col: props.col,
      data: cells ? cells[props.col] : '?',
      rowSelect: false
    });
  }

  render() {
    const model = this.state.model;
    return (
      <Grid
        bodyBorder={this.props.bodyBorder}
        headerBorder={this.props.headerBorder}
        ref={this.ref}
        rowsCount={model.getRowsCount()}
        colsCount={model.getColsCount()}
        renderCell={this.renderCell}
        renderHeader={this.props.renderHeader}
        onScroll={this.onScroll}
        onRowsRangeInfo={model.setRowsRange}
      />
    );
  }
}

export interface Row {
  [col: string]: string;
}

export type Loader = (from: number, count: number) => Promise<Array<Row>>;

export interface GirdModelArgs {
  rowsCount: number;
  colsCount: number;
  loader?: Loader;
}

interface RowData {
  cells: Array<string>;
}

interface Bunch {
  task?: Promise<Bunch>;
  rows?: Array< RowData >;
}

export class GridModel extends Publisher {
  private bunch: {[bunchIdx: number]: Bunch} = {};
  private rowsPerBunch: number = 50;
  private loadedRows: number = 0;

  private loadTask: Promise<Bunch>;
  private dataLoader: Loader;
  private rowsCount: number;
  private colsCount: number;
  private rowsRange: RowsRange = { firstRow: 0, rowsCount: 0 };

  constructor(args: GirdModelArgs) {
    super();

    this.rowsCount = args.rowsCount;
    this.colsCount = args.colsCount;
    this.dataLoader = args.loader;
  }

  setRowsRange = (range: RowsRange) => {
    this.rowsRange.firstRow = range.firstRow;
    this.rowsRange.rowsCount = range.rowsCount;
  }

  setDataLoader(loader: Loader) {
    this.dataLoader = loader;
  }

  getRowsCount() {
    return this.loadedRows;
  }

  getBunch(idx: number) {
    return this.bunch[idx];
  }

  getCells(rowIdx: number): { cells: Array<string>, bunchIdx: number } {
    const bunchIdx = Math.floor(rowIdx / this.rowsPerBunch);
    const bunch = this.bunch[ bunchIdx ];
    rowIdx = rowIdx - bunchIdx * this.rowsPerBunch;
    if (!bunch || !bunch.rows || bunch.rows[rowIdx] == null)
      return { cells: null, bunchIdx };

    return { cells: bunch.rows[rowIdx].cells, bunchIdx };
  }

  getTotalRowsCount() {
    return this.rowsCount;
  }

  getColsCount() {
    return this.colsCount;
  }

  reload(args?: { cols?: number, rows?: number }) {
    args = args || {};
    if (this.loadTask) {
      this.loadTask.cancel();
      this.loadTask = null;
    }

    if (args.cols != null)
      this.colsCount = args.cols;

    if (args.rows != null) {
      this.rowsCount = args.rows;
      this.loadedRows = 0;
      this.bunch = {};
      this.loadNext();
    } else {
      const startBunch = Math.floor(this.rowsRange.firstRow / this.rowsPerBunch);
      const endBunch = Math.floor((this.rowsRange.firstRow + this.rowsRange.rowsCount) / this.rowsPerBunch);
      
      this.bunch = {};
      for (let n = startBunch; n <= endBunch; n++)
        this.reloadBunch({ bunchIdx: n, cancel: true });
    }
  }

  reloadBunch(args: { bunchIdx: number, cancel?: boolean }) {
    const from = args.bunchIdx * this.rowsPerBunch;
    const count = Math.min(from + this.rowsPerBunch, this.rowsCount) - from;
    let bunch: Bunch = this.bunch[args.bunchIdx];
    if (!bunch)
      bunch = (this.bunch[args.bunchIdx] = { rows: [] });

    if (bunch.task && args.cancel) {
      bunch.task.cancel();
      bunch.task = null;
    }

    if (bunch.task)
      return bunch.task;

    console.log('load bunch', args.bunchIdx, `${from} : ${count}`);
    bunch.task = this.dataLoader(from, count)
    .then(rows => {
      bunch.task = null;

      bunch.rows = [];
      for (let row of rows)
        bunch.rows.push( { cells: Object.keys(row).map(v => row[v]) } );
      this.delayedNotify({ type: 'load' });

      return bunch;
    });

    return bunch.task;
  }

  loadNext(): Promise< Bunch > {
    if (this.loadTask)
      return this.loadTask;

    const bunchIdx = Math.floor(this.loadedRows / this.rowsPerBunch);
    if (this.bunch[bunchIdx])
      return Promise.resolve(this.bunch[bunchIdx]);

    return (
      this.loadTask = this.reloadBunch({ bunchIdx })
      .then(bunch => {
        this.loadTask = null;
        this.loadedRows += bunch.rows.length;
        return bunch;
      })
    );
  }
}
