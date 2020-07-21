import * as React from 'react';
import { MultiGrid, GridCellProps, ScrollParams, ScrollbarPresenceParams } from 'react-virtualized';
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
  gridCardsRow: 'grid-cards-row',
  gridCardWrap: 'grid-card-wrap',
  gridCard: 'grid-card',
  cardBorder: 'grid-card-border',
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
  wrapperProps: React.HTMLProps<HTMLDivElement>;
}

export interface CellProps {
  readonly row: number;
  readonly col: number;
  readonly rowSelect: boolean;
  className?: string;
}

export interface CardProps {
  readonly row: number;
  className?: string;
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
  cardsView?: boolean;

  headerBorder?: boolean;
  bodyBorder?: boolean;
  cardBorder?: boolean;
  oddRow?: string;
  evenRow?: string;

  renderHeader?(props: HeaderProps): React.ReactChild;
  renderCell(props: CellProps): React.ReactChild;
  renderCard?(props: CardProps): React.ReactChild;
  onScroll?(props: ScrollParams): void;
  onScrollToBottom?(props: ScrollParams): void;
  onRowsRangeInfo?(props: RowsRange): void;
}

export class Grid extends React.Component<Props, Partial<State>> {
  ref = React.createRef<MultiGrid>();

  constructor(props: Props) {
    super(props);

    const m = props.model || new GridModel();
    this.state = { model: m, view: this };
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

    if (p.cardBorder != null)
      curr.setCardBorder(p.cardBorder);

    if (p.cardsView != null)
      curr.setViewType(p.cardsView ? 'cards' : 'rows');

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
    this.setState({});
    this.ref.current && this.ref.current.forceUpdateGrids();
  }

  private onSelect = () => {
    const ref = this.ref.current;
    const m = this.state.model;
    const range = m.getRenderRange();

    if (m.getViewType() == 'cards') {
      const card = m.getCardFromRow(m.getRowFocus());
      const rh = this.getRowHeight({ index: 1 });
      if (range.rowCount == 1 || card.rowIndex <= range.firstRow) {
        ref.setState({ scrollTop: card.rowIndex * rh });
      } else if (card.rowIndex + 2 > range.firstRow + range.rowCount) {
        const h = m.getHeight();
        ref.setState({ scrollTop: (card.rowIndex + 1) * rh - h });
      } else {
        ref.setState({});
      }
    } else {
      const header = m.getHeader();
      const headerH = header ? m.getRowHeight({ index: 0 }) : 0;
      const rh = this.getRowHeight({ index: 1 });
      if (m.getRowFocus() + 2 > range.firstRow + range.rowCount) {
        const h = m.getHeight()  - headerH;
        ref.setState({ scrollTop: (m.getRowFocus() + 1) * rh - h });
      } else if (m.getRowFocus() <= range.firstRow) {
        ref.setState({ scrollTop: m.getRowFocus() * rh });
      } else {
        ref.setState({});
      }
    }
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

    const header: HeaderProps = {
      col: props.columnIndex,
      wrapperProps: {}
    };
    const jsx = this.props.renderHeader ? this.props.renderHeader(header) : null;
    return (
      <div style={hdr} className={className}>
        <div className={cn('horz-panel-1', scss.labelWrapper)} {...header.wrapperProps}>
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
            m.delayedNotify({ type: 'col-resized' });
          }}
          onDoubleClick={() => {
            m.resetColSize(props.columnIndex);
          }}
        />
      </div>
    );
  }

  private renderCard = (props: GridCellProps) => {
    const m = this.state.model;
    const style: React.CSSProperties = {
      ...props.style
    };

    const padding = m.getCardsPadding();
    let cardWidth = m.getCardWidth();
    const w = m.getWidth() - m.getScrollSize();
    let newCols = m.getCardsPerRow();
    if (newCols == -1) {
      newCols = Math.max(1, Math.floor(w / cardWidth));
    } else {
      cardWidth = (w - padding * (newCols - 1)) / newCols;
      if (cardWidth < m.getCardWidth()) {
        cardWidth = m.getCardWidth();
        newCols = Math.max(1, Math.floor(w / cardWidth));
      }
    }

    const startRows = props.rowIndex * newCols;
    let count = Math.min(m.getRowsCount(), startRows + newCols) - startRows;
    count = Math.max(1, count);
    
    style.paddingLeft = style.paddingRight = style.paddingTop = padding;
    return (
      <div
        className={cn(scss.gridCardsRow)}
        style={{...style, height: m.getCardHeight() + padding }}
        key={props.key}
      >
        {Array(count).fill(null).map((_, i) => {
          let jsx: React.ReactChild = null;
          let card: CardProps = { row: startRows + i };
          if (this.props.renderCard)
            jsx = this.props.renderCard(card);

          const className = cn(
            scss.gridCardWrap,
            m.getCardBorder() && scss.cardBorder,
            card.className,
            m.isCellSelect(card.row, 0) && scss.gridSelCell
          );

          return (
            <div
              className={className}
              style={{ width: cardWidth, marginLeft: i != 0 ? padding : undefined }}
              key={i}
              onClick={e => {
                m.setSelect({
                  row: card.row,
                  col: 0,
                  select: true,
                  multiple: e.ctrlKey
                });
              }}
            >
              <div className={scss.gridCard}>
                {jsx}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  private renderCell = (props: GridCellProps) => {
    const m = this.state.model;
    if (m.getViewType() == 'cards')
      return this.renderCard(props);

    const hdr = m.getHeader() && this.props.renderHeader;
    if (hdr && props.rowIndex == 0)
      return this.renderHeaderCell(props);

    const col = props.columnIndex;
    const row = hdr ? props.rowIndex - 1 : props.rowIndex;
    const rowDataIdx = m.getRowIdx(row);
    const rowSelect = m.isRowSelect(row);
    const cellSelect = m.isCellSelect(row, col);
    const cellProps: CellProps = {
      row: rowDataIdx,
      col,
      rowSelect,
      className: 'cell-align-center'
    };
    const jsx = this.props.renderCell(cellProps);
    const className = cn(
      scss.gridCell,
      rowSelect && scss.gridSelRow,
      cellSelect && scss.gridSelCell,
      cellProps.className,
      m.getBodyBorder() && scss.border,
      (props.columnIndex == m.getColsCount() - 1) && scss.lastCol,
      (row == m.getRowsCount() - 1) && scss.lastRow
    );
  
    const style: React.CSSProperties = {
      ...props.style
    };

    if (this.props.oddRow && !(rowDataIdx % 2))
      style.backgroundColor = this.props.oddRow;

    if (this.props.evenRow && (rowDataIdx % 2))
      style.backgroundColor = this.props.evenRow;

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
        {jsx}
      </div>
    );
  }

  private setSize = (w: number, h: number) => {
    this.state.model.setSize(w, h);
  }

  private getRowHeight = (row: { index: number }) => {
    const m = this.state.model;
    if (m.getViewType() == 'cards')
      return m.getCardHeight() + m.getCardsPadding();

    return m.getRowHeight(row);
  }

  private getColWidth = (col: { index: number }) => {
    const m = this.state.model;
    if (m.getViewType() == 'cards')
      return m.getWidth() - m.getScrollSize();

    return m.getColWidth(col);
  }

  private onScrollbarPresence = (p: ScrollbarPresenceParams) => {
    this.state.model.setScrollSize(p.size);
  }

  private renderTable = (w: number, h: number) => {
    const m = this.state.model;
    let rows = m.getRowsCount();
    let cols = m.getColsCount();
    let header = m.getHeader() ? this.props.renderHeader != null : false;

    if (m.getViewType() == 'cards') {
      rows = Math.ceil(rows / m.getCardsCols());
      cols = 1;
      header = false;
    }

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
        columnWidth={this.getColWidth}
        rowHeight={this.getRowHeight}
        cellRenderer={this.renderCell}
        className={cn(scss.gridCustom)}
        onScroll={this.onScroll}
        onScrollbarPresenceChange={this.onScrollbarPresence}
      />
    );
  }

  private onKeyDown = (e: React.KeyboardEvent) => {
    const m = this.state.model;
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

    if (m.getViewType() == 'cards') {
      const res = m.getCardFromRow(m.getRowFocus());
      m.setSelect({
        row: m.getRowFromCard({ rowIndex: res.rowIndex + row, colIndex: res.colIndex + col }),
        col: 0,
        select: true
      });
    } else if (row || col) {
      m.setSelect({
        row: m.getRowFocus() + row,
        col: m.getColFocus() + col,
        select: true
      });
    }
  }

  private renderView() {
    return (
      <div
        style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, padding: 5 }}
        onKeyDown={this.onKeyDown}
      >
        <FitToParent
          wrapToFlex
          onSize={this.setSize}
          render={this.renderTable}
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
