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
  gridSelRow: 'grid-row-sel',
  gridSelCell: 'grid-cell-sel',
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
  key?: number;
  view?: Grid;
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
  onScrollToBottom?(props: ScrollParams): void;
  onRowsRangeInfo?(props: RowsRange): void;
}

export class Grid extends React.Component<Props, State> {
  state: State;
  ref = React.createRef<MultiGrid>();

  constructor(props: Props) {
    super(props);

    const m = props.model || new GridModel();
    this.state = { model: m, view: this };
    Grid.getDerivedStateFromProps(props, this.state);
    this.subscribe(m);
  }

  subscribe(m: GridModel) {
    m.subscribe(this.onSubscriber);
    m.subscribe(this.onResized, 'resize');
    m.subscribe(this.onResizedRow, 'resize-row');
    m.subscribe(this.onRender, 'render');
    m.subscribe(this.onSelect, 'select');
    m.subscribe(this.onScrollTop, 'scroll-top');
  }

  unsubscribe(m: GridModel) {
    m.unsubscribe(this.onSubscriber);
    m.unsubscribe(this.onResized, 'resize');
    m.unsubscribe(this.onResizedRow, 'resize-row');
    m.unsubscribe(this.onRender, 'render');
    m.unsubscribe(this.onSelect, 'select');
    m.unsubscribe(this.onScrollTop, 'scroll-top');
  }

  componentWillUnmount() {
    this.unsubscribe(this.state.model);
  }

  static getDerivedStateFromProps(p: Props, s: State): State {
    const curr = s.model;
    if (p.autoresize != null)
      curr.setAutosize(p.autoresize);

    if (p.rowsCount != null)
      curr.setRowsCount(p.rowsCount);

    if (p.colsCount != null)
      curr.setColsCount(p.colsCount);

    if (p.bodyBorder != null)
      curr.setBodyBorder(p.bodyBorder);

    let newState: State = null;
    const next = p.model;
    if (next != curr) {
      newState = newState || {...s};
      newState.key = (newState.key || 0) + 1;
      newState.model = next;
      s.view.unsubscribe(curr);
      s.view.subscribe(next);
    }

    return newState;
  }

  private onSubscriber = () => {
    this.setState({});
  };

  private onScrollTop = () => {
    this.ref.current && this.ref.current.setState({ scrollTop: 0 }, () => {
      this.ref.current && this.ref.current.forceUpdateGrids();
    });
  }

  private onResized = () => {
    this.ref.current && this.ref.current.recomputeGridSize();
  }

  private onResizedRow = () => {
    const s = {...this.ref.current.state};
    this.setState({ key: (this.state.key || 0) + 1 }, () => {
      this.ref.current && this.ref.current.setState(s);
    });
  }

  private onRender = () => {
    this.ref.current && this.ref.current.forceUpdateGrids();
  }

  private onSelect = () => {
    const ref = this.ref.current;
    const m = this.state.model;
    const range = m.getRenderRange();

    const header = m.getHeader();
    const headerH = header ? m.getRowHeight({ index: 0 }) : 0;
    if (m.getRowFocus() + 2 > range.firstRow + range.rowCount) {
      const rh = m.getRowHeight({ index: 1 });
      const h = m.getHeight() - headerH;
      ref.setState({ scrollTop: (m.getRowFocus() + 1) * rh - h });
    } else if (m.getRowFocus() <= range.firstRow) {
      const rh = m.getRowHeight({ index: 1 });
      ref.setState({ scrollTop: m.getRowFocus() * rh });
    }

    ref.setState({});
  }

  onScroll = (params: ScrollParams) => {
    this.props.onScroll && this.props.onScroll(params);
    const diff = Math.round(params.scrollHeight - (params.scrollTop + params.clientHeight));
    if (diff <= 0)
      this.props.onScrollToBottom && this.props.onScrollToBottom(params);
  };

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
    const hdr = m.getHeader() && this.props.renderHeader;
    if (hdr && props.rowIndex == 0)
      return this.renderHeaderCell(props);

    const col = props.columnIndex;
    const row = hdr ? props.rowIndex - 1 : props.rowIndex;
    const rowDataIdx = m.getRowIdx(row);
    const rowSelect = m.isRowSelect(row);
    const cellSelect = m.isCellSelect(row, col);
    const className = cn(
      scss.gridCell,
      rowSelect && scss.gridSelRow,
      cellSelect && scss.gridSelCell,
      m.getBodyBorder() && scss.border,
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
            col,
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

          let row = 0;
          let col = 0;
          if (e.keyCode == KeyCode.ARROW_DOWN) {
            row += 1;
          } else if (e.keyCode == KeyCode.ARROW_UP) {
            row += -1;
          } else if (e.keyCode == KeyCode.ARROW_LEFT) {
            col += -1;
          } else if (e.keyCode == KeyCode.ARROW_RIGHT) {
            col += 1;
          }

          if (row || col) {
            m.setSelect({
              row: m.getRowFocus() + row,
              col: m.getColFocus() + col,
              select: true
            });
          }
        }}
      >
        <FitToParent
          wrapToFlex
          onSize={(w, h) => {
            m.setSize(w, h);
          }}
          render={(w, h) => {
            const header = m.getHeader() ? this.props.renderHeader != null : false;
            return (
              <MultiGrid
                key={this.state.key}
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
                fixedRowCount={header ? 1 : 0}
                rowCount={rows + (header ? 1 : 0)}
                columnCount={cols}
                columnWidth={m.getColWidth}
                rowHeight={m.getRowHeight}
                cellRenderer={this.renderCell}
                className={scss.gridCustom}
                onScroll={this.onScroll}
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
