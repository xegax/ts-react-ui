import * as React from 'react';
import { Publisher } from 'objio/common/publisher';
import { MultiGrid, GridCellProps, ScrollParams } from 'react-virtualized';
import { className as cn } from './common/common';
import { VerticalResizer } from './resizer';
import { FitToParent } from './fittoparent';

export { ScrollParams };

interface State {
  gd: GridData;
}

export interface HeaderProps {
  col: number;
}

export interface CellProps {
  row: number;
  col: number;
}

export interface RowsRange {
  firstRow: number;
  rowsCount: number;
}

export interface Props {
  className?: string;
  rowsCount: number;
  colsCount: number;
  autoresize?: boolean;

  headerBorder?: boolean;
  bodyBorder?: boolean;  

  getColumnSize?(col: number): number | null;
  setColumnSize?(col: number, size: number): void;

  renderHeader?(props: HeaderProps): React.ReactChild;
  renderCell(props: CellProps): React.ReactChild;
  onScroll?(props: ScrollParams): void;
  onRowsRangeInfo?(props: RowsRange): void;
}

export class Grid extends React.Component<Props, State> {
  static defaultProps: Partial<Props> = {
    headerBorder: true,
    bodyBorder: true
  };

  rowStartIndex: number;
  rowCount: number;

  state = {
    gd: new GridData()
  };
  ref = React.createRef<MultiGrid>();

  constructor(props: Props) {
    super(props);

    this.state.gd.subscribe(this.subscriber);
    this.state.gd.subscribe(this.resized, 'resize');

    this.state.gd.setRowsCount(props.rowsCount);
    this.state.gd.setColsCount(props.colsCount);
    if (props.autoresize != null)
      this.state.gd.setAutoresize(props.autoresize);

    this.state.gd.setColumnSizeGetter(this.props.getColumnSize);
  }


  static getDerivedStateFromProps(newProps: Props, prevState: State): State {
    if (newProps.autoresize != null)
      prevState.gd.setAutoresize(newProps.autoresize);

    if (newProps.rowsCount != null)
      prevState.gd.setRowsCount(newProps.rowsCount);

    if (newProps.colsCount != null)
      prevState.gd.setColsCount(newProps.colsCount);

    prevState.gd.setColumnSizeGetter(newProps.getColumnSize);
    return prevState;
  }

  subscriber = () => {
    this.setState({});
  };

  resized = () => {
    this.ref.current.recomputeGridSize();
  }

  renderHeaderCell = (props: GridCellProps) => {
    const hdr: React.CSSProperties = {
      ...props.style
    };
    if (hdr.height)
      hdr.lineHeight = hdr.height + 'px';

    const className = cn(
      'grid-header-col',
      this.state.gd.isColFixed(props.columnIndex) && 'fixed-col',
      this.props.headerBorder && 'border',
      props.columnIndex == this.state.gd.getColsNum() - 1 && 'last'
    );

    const jsx = this.props.renderHeader ? this.props.renderHeader({ col: props.columnIndex }) : null;
    return (
      <div style={hdr} className={className}>
        <div className={cn('horz-panel-1', 'label-wrapper')}>
          {jsx}
        </div>
        <VerticalResizer
          style={{ backgroundColor: 'blue' }}
          size={+props.style.width}
          onResizing={size => {
            this.state.gd.setColSize(props.columnIndex, size);
            this.ref.current.recomputeGridSize();
          }}
          onResized={size => {
            if (!this.props.setColumnSize)
              return;

            this.props.setColumnSize(props.columnIndex, size);
            this.state.gd.resetColSize(props.columnIndex);
          }}
          onDoubleClick={() => {
            if (this.props.setColumnSize)
              this.props.setColumnSize(props.columnIndex, null);

            this.state.gd.resetColSize(props.columnIndex);
            this.ref.current.recomputeGridSize();
          }}
        />
      </div>
    );
  }

  renderCell = (props: GridCellProps) => {
    const hdr = this.props.renderHeader;
    if (hdr && props.rowIndex == 0)
      return this.renderHeaderCell(props);

    const row = hdr ? props.rowIndex - 1 : props.rowIndex;
    const className = cn(
      'grid-cell',
      this.props.bodyBorder && 'border',
      (props.columnIndex == this.state.gd.getColsNum() - 1) && 'last-col',
      (row == this.state.gd.getRowsNum() - 1) && 'last-row'
    );
  
    const style: React.CSSProperties = {
      ...props.style
    };
    if (style.height)
      style.lineHeight = props.style.height + 'px';

    return (
      <div className={className} style={style}>
        {this.props.renderCell({ row, col: props.columnIndex })}
      </div>
    );
  }

  renderView() {
    const gd = this.state.gd;
    const rows = gd.getRowsNum();
    const cols = gd.getColsNum();
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, padding: 5 }}>
        <FitToParent
          wrapToFlex
          render={(w, h) => {
            this.state.gd.setWidth(w);

            return (
              <MultiGrid
                onSectionRendered={p => {
                  this.rowStartIndex = p.rowStartIndex;
                  this.rowCount = gd.getRowsNum() ? (p.rowStopIndex - p.rowStartIndex) + 1 : 0;
                  this.props.onRowsRangeInfo && this.props.onRowsRangeInfo({ firstRow: this.rowStartIndex, rowsCount: this.rowCount });
                }}
                ref={this.ref}
                width={w}
                height={h}
                autoContainerWidth
                fixedRowCount={this.props.renderHeader ? 1 : 0}
                rowCount={rows + (this.props.renderHeader ? 1 : 0)}
                columnCount={cols}
                columnWidth={gd.getColWidth}
                rowHeight={gd.getRowHeight}
                cellRenderer={this.renderCell}
                className='grid-custom'
                onScroll={this.props.onScroll}
              />
            );
          }}
        />
      </div>
    );
  }

  render() {
    return (
      <div
        className={cn('grid-custom', this.props.className)} 
        style={{
          position: 'absolute',
          left: 0, top: 0, right: 0, bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {this.renderView()}
      </div>
    );
  }
}

class GridData extends Publisher {
  private defaultColWidth = 100;
  private defaultRowHeight = 30;
  private colsWith: { [name: string]: number } = {};
  private fixedWidth: number = 0;
  private fixedCols: number = 0;

  private rowsNum = 5;
  private colsNum = 5;
  private width: number;
  private autoResize = true;
  private columnSizeGetterImpl: (col: number) => number;

  private columnSizeGetter = (col: number): number => {
    if (this.colsWith[col] != null || !this.columnSizeGetterImpl)
      return this.colsWith[col];

    return this.columnSizeGetterImpl(col);
  }

  setColumnSizeGetter(getter: (col: number) => number) {
    this.columnSizeGetterImpl = getter;
  }

  setAutoresize(autoresize: boolean) {
    if (this.autoResize == autoresize)
      return;

    this.autoResize = autoresize;
    this.delayedNotify({ type: 'resize' });
  }

  setRowsCount(rowsCount: number) {
    if (this.rowsNum == rowsCount)
      return;

    this.rowsNum = rowsCount;
    this.delayedNotify({ type: 'resize' });
  }

  setColsCount(colsCount: number) {
    if (this.colsNum == colsCount)
      return;

    this.colsNum = colsCount;
    this.delayedNotify();
  }

  setWidth(w: number) {
    if (this.width == w)
      return;

    this.width = w;
    this.delayedNotify({ type: 'resize' });
  }

  getRowsNum() {
    return this.rowsNum;
  }

  getColsNum() {
    return this.colsNum;
  }

  getColWidth = (col: { index: number }) => {
    const cw = this.columnSizeGetter(col.index);
    if (cw != null)
      return cw;

    if (this.width && this.autoResize) {
      return Math.floor((this.width - this.fixedWidth) / (this.colsNum - this.fixedCols));
    }

    return this.defaultColWidth;
  }

  getRowHeight = (row: { index: number }) => {
    return this.defaultRowHeight;
  }

  getCell(row: number, col: number): string {
    return 'r' + row + ':c' + col;
  }

  getCol(col: number): string {
    return 'col-' + col;
  }

  isColFixed(col: number) {
    return this.columnSizeGetter(col) != null;
  }

  resetColSize(col: number) {
    delete this.colsWith['' + col];
    this.recalcFixedSizes();
  }

  setColSize(col: number, size: number) {
    this.colsWith['' + col] = size;
    this.recalcFixedSizes();
  }

  private recalcFixedSizes() {
    this.fixedWidth = 0;
    this.fixedCols = 0;
    for (let c = 0; c < this.colsNum; c++) {
      const size = this.columnSizeGetter(c);
      if (size == null)
        continue;

      this.fixedWidth += size;
      this.fixedCols++;
    }
  }
}
