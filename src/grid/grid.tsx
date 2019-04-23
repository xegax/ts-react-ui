import * as React from 'react';
import { MultiGrid, GridCellProps, ScrollParams } from 'react-virtualized';
import { cn } from '../common/common';
import { VerticalResizer } from '../resizer';
import { FitToParent } from '../fittoparent';
import { GridModel } from './grid-model';
import { KeyCode } from '../common/keycode';

export { ScrollParams, GridModel };

const scss = {
  gridCustom: 'grid-custom',
  gridHeaderCol: 'grid-header-col',
  gridCell: 'grid-cell',
  gridSelRow: 'grid-sel-row',
  gridFocusRow: 'grid-focus-row',
  lastCol: 'last-col',
  lastRow: 'last-row',
  labelWrapper: 'label-wrapper',
  fixedCol: 'fixed-col',
  border: 'border',
  last: 'last'
};

interface State {
  model: GridModel;
}

export interface HeaderProps {
  col: number;
}

export interface CellProps {
  row: number;
  col: number;
  rowSelect: boolean;
}

export interface RowsRange {
  firstRow: number;
  rowsCount: number;
}

export interface Props {
  model?: GridModel;

  className?: string;
  rowsCount?: number;
  colsCount?: number;
  autoresize?: boolean;

  headerBorder?: boolean;
  bodyBorder?: boolean;  

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

  state: State;
  ref = React.createRef<MultiGrid>();

  constructor(props: Props) {
    super(props);

    const m = props.model || new GridModel();
    this.state = { model: m };
    m.subscribe(this.onSubscriber);
    m.subscribe(this.onResized, 'resize');
    m.subscribe(this.onRender, 'render');
    m.subscribe(this.onSelect, 'select');

    Grid.getDerivedStateFromProps(props, this.state);
  }

  static getDerivedStateFromProps(p: Props, s: State): State {
    const m = s.model;
    if (p.autoresize != null)
      m.setAutosize(p.autoresize);

    if (p.rowsCount != null)
      m.setRowsCount(p.rowsCount);

    if (p.colsCount != null)
      m.setColsCount(p.colsCount);

    m.setHeader(p.renderHeader != null);

    return null;
  }

  private onSubscriber = () => {
    this.setState({});
  };

  private onResized = () => {
    this.ref.current.recomputeGridSize();
  }

  private onRender = () => {
    this.ref.current.forceUpdateGrids();
  }

  private onSelect = () => {
    const m = this.state.model;
    const range = m.getRenderRange();
    if (m.getRowFocus() + 1 > range.firstRow + range.rowCount) {
      const rh = m.getRowHeight({ index: 0 });
      const h = m.getHeight() + (m.getHeader() ? -rh : 0);
      this.ref.current.setState({ scrollTop: (m.getRowFocus() + 1) * rh - h });
    } else if (m.getRowFocus() <= range.firstRow) {
      const rh = m.getRowHeight({ index: 0 });
      this.ref.current.setState({ scrollTop: m.getRowFocus() * rh });
    }

    this.ref.current.setState({});
  }

  renderHeaderCell = (props: GridCellProps) => {
    const m = this.state.model;
    const hdr: React.CSSProperties = {
      ...props.style
    };
    if (hdr.height)
      hdr.lineHeight = hdr.height + 'px';

    const className = cn(
      scss.gridHeaderCol,
      m.isColFixed(props.columnIndex) && scss.fixedCol,
      this.props.headerBorder && scss.border,
      props.columnIndex == m.getColsCount() - 1 && scss.last
    );

    const jsx = this.props.renderHeader ? this.props.renderHeader({ col: props.columnIndex }) : null;
    return (
      <div style={hdr} className={className}>
        <div className={cn('horz-panel-1', scss.labelWrapper)}>
          {jsx}
        </div>
        <VerticalResizer
          size={+props.style.width}
          onResizing={size => {
            m.setColSize(props.columnIndex, size);
            m.notify();
          }}
          onResized={size => {
            m.setColSize(props.columnIndex, size);
          }}
          onDoubleClick={() => {
            m.resetColSize(props.columnIndex);
          }}
        />
      </div>
    );
  }

  renderCell = (props: GridCellProps) => {
    const m = this.state.model;
    const hdr = this.props.renderHeader;
    if (hdr && props.rowIndex == 0)
      return this.renderHeaderCell(props);

    const col = props.columnIndex;
    const row = hdr ? props.rowIndex - 1 : props.rowIndex;
    const rowDataIdx = m.getRowIdx(row);
    const rowSelect = m.isRowSelect(row);
    const className = cn(
      scss.gridCell,
      rowSelect && scss.gridSelRow,
      this.props.bodyBorder && scss.border,
      (props.columnIndex == m.getColsCount() - 1) && scss.lastCol,
      (row == m.getRowsCount() - 1) && scss.lastRow
    );
  
    const style: React.CSSProperties = {
      ...props.style
    };
    if (style.height)
      style.lineHeight = props.style.height + 'px';

    return (
      <div
        key={props.key}
        className={className}
        style={style}
        onClick={e => {
          m.setSelect({
            row,
            select: true,
            multiple: e.ctrlKey
          });
        }}
      >
        {this.props.renderCell({ row: rowDataIdx, col, rowSelect })}
      </div>
    );
  }

  renderView() {
    const m = this.state.model;
    const rows = m.getRowsCount();
    const cols = m.getColsCount();
    return (
      <div
        style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, padding: 5 }}
        onKeyDown={e => {
          e.stopPropagation();
          e.preventDefault();

          let row = Math.max(0, m.getRowFocus());
          if (e.keyCode == KeyCode.ARROW_DOWN) {
            row += 1;
          } else if (e.keyCode == KeyCode.ARROW_UP) {
            row += -1;
          }

          m.setSelect({ row, select: true });
        }}
      >
        <FitToParent
          wrapToFlex
          onSize={(w, h) => {
            m.setSize(w, h);
          }}
          render={(w, h) => {
            return (
              <MultiGrid
                onSectionRendered={p => {
                  const firstRow = p.rowStartIndex;
                  const rowsCount = rows ? (p.rowStopIndex - p.rowStartIndex) + 1 : 0;
                  m.setRenderRange(firstRow, rowsCount);
                  this.props.onRowsRangeInfo && this.props.onRowsRangeInfo({ firstRow, rowsCount });
                }}
                ref={this.ref}
                width={w}
                height={h}
                autoContainerWidth
                fixedRowCount={this.props.renderHeader ? 1 : 0}
                rowCount={rows + (this.props.renderHeader ? 1 : 0)}
                columnCount={cols}
                columnWidth={m.getColWidth}
                rowHeight={m.getRowHeight}
                cellRenderer={this.renderCell}
                className={scss.gridCustom}
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
        className={cn(scss.gridCustom, this.props.className)} 
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
