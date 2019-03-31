import * as React from 'react';
import {
  Grid,
  CellProps,
  HeaderProps,
  ScrollParams
} from './grid';
import { Publisher } from 'objio';

interface CellPropsExt extends CellProps {
  data: string;
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
    const diff = Math.round(params.scrollHeight - (params.scrollTop + params.clientHeight));
    if (diff <= 0)
      this.state.model.loadNext();
  };

  renderCell = (props: CellProps) => {
    return this.props.renderCell({
      row: props.row,
      col: props.col,
      data: this.state.model.getRow(props.row)[props.col]
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

export class GridModel extends Publisher {
  private rows = Array<Array<string>>();
  private loadTask: Promise<Array<Row>>;
  private dataLoader: Loader;
  private rowsCount: number;
  private colsCount: number;
  private rowsPerLoad: number = 50;

  constructor(args: GirdModelArgs) {
    super();

    this.rowsCount = args.rowsCount;
    this.colsCount = args.colsCount;
    this.dataLoader = args.loader;
  }

  setDataLoader(loader: Loader) {
    this.dataLoader = loader;
  }

  getRowsCount() {
    return this.rows.length;
  }

  getRow(rowIdx: number): Array<string> {
    return this.rows[rowIdx];
  }

  getTotalRowsCount() {
    return this.rowsCount;
  }

  getColsCount() {
    return this.colsCount;
  }

  reload(args?: { cols?: number, rows?: number }) {
    args = args || {};
    if (args.cols != null)
      this.colsCount = args.cols;

    if (args.rows != null)
      this.rowsCount = args.rows;

    this.rows = [];
    return this.loadNext();
  }

  loadNext(): Promise<Array<Row>> {
    if (this.loadTask)
      return this.loadTask;

    const from = this.rows.length;
    const count = Math.min(from + this.rowsPerLoad, this.rowsCount) - from;
    this.loadTask = this.dataLoader(from, count)
    .then(rows => {
      this.loadTask = null;
      for (let row of rows)
        this.rows.push( Object.keys(row).map(v => row[v]) );
      this.delayedNotify({ type: 'load' });
      return rows;
    });
  }
}
