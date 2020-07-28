import { Publisher } from 'objio/common/publisher';
import { clamp } from '../common/common';

export type EventType = 'resize' | 'col-resized' | 'render' | 'select' | 'resize-row' | 'scroll-top';
export type SelectType = 'none' | 'rows' | 'cells';
export type SelectCells = {[row: number]: Set<number>};
export type ViewType = 'rows' | 'cards';

export interface GridModelArgs<T = GridModel> {
  rowsCount: number;
  colsCount: number;
  prev?: T;
}

export class GridModel extends Publisher<EventType> {
  private defaultColWidth = 100;
  private defaultRowHeight = 30;
  private headerHeight = 50;

  private columnWidth: { [colIdx: number]: number } = {};
  private fixedWidth: number = 0;
  private fixedCols: number = 0;
  private width: number = 0;
  private height: number = 0;

  protected rowsCount = 0;
  protected colsCount = 0;
  private autosize = true;
  protected reverse = false;
  private selection: SelectCells = {};
  private focusRow = -1;
  private focusCol = -1;
  private firstRenderRow: number = 0;
  private renderRowCount: number = 0;
  private bodyBorder: boolean = true;
  private header: boolean = true;
  private cardBorder: boolean = true;
  private selectType: SelectType = 'cells';
  private viewType: ViewType = 'rows';
  private cardWidth: number = 200;
  private cardHeight: number = 300;
  private cardsPerRow: number = -1;
  private cardsPadding: number = 4;
  private scrollSize: number = 0;

  protected naturalIdx = (idx: number) => idx;
  protected reverseIdx = (idx: number) => this.rowsCount - idx - 1;
  getRowIdx = this.naturalIdx;

  constructor(args?: GridModelArgs) {
    super();

    if (args) {
      this.rowsCount = args.rowsCount;
      this.colsCount = args.colsCount;
      this.restoreStateFrom(args.prev);
    }
  }

  setScrollSize(size: number) {
    if (this.scrollSize == size)
      return;

    this.scrollSize = size;
    this.delayedNotify();
  }

  getScrollSize() {
    return this.scrollSize;
  }

  setCardsPadding(p: number) {
    if (this.cardsPadding == p)
      return;

    this.cardsPadding = p;
    this.delayedNotify({ type: 'resize-row' });
  }

  getCardsCols() {
    let cols = this.cardsPerRow;
    if (cols == -1)
      cols = Math.max(1, Math.floor((this.width - this.scrollSize) / this.cardWidth));
    return cols;
  }

  getCardFromRow(row: number): { rowIndex: number, colIndex: number } {
    const cols = this.getCardsCols();
    return {
      rowIndex: Math.floor(row / cols),
      colIndex: row % cols
    };
  }

  getRowFromCard(args: { rowIndex: number, colIndex: number }) {
    const cols = this.getCardsCols();
    const rows = Math.ceil(this.rowsCount / cols);
    return clamp(args.rowIndex, [0, rows - 1]) * cols + clamp(args.colIndex, [0, cols - 1]);
  }

  getCardsPadding() {
    return this.cardsPadding;
  }

  setCardsPerRow(cards: number) {
    if (this.cardsPerRow == cards)
      return;

    this.cardsPerRow = cards;
    this.delayedNotify();
  }

  getCardsPerRow() {
    return this.cardsPerRow;
  }

  getCardWidth() {
    return this.cardWidth;
  }

  setCardWidth(w: number) {
    if (this.cardWidth == w)
      return;

    this.cardWidth = w;
    this.delayedNotify();
  }

  getCardHeight() {
    return this.cardHeight;
  }

  setCardHeight(h: number) {
    if (this.cardHeight == h)
      return;

    this.cardHeight = h;
    this.delayedNotify({ type: 'resize-row' });
  }

  restoreStateFrom(m: GridModel) {
    if (!m)
      return;

    this.header = m.header;
    this.selectType = m.selectType;
    this.reverse = m.reverse;
    this.bodyBorder = m.bodyBorder;
    this.autosize = m.autosize;
    this.headerHeight = m.headerHeight;
    this.width = m.width;
    this.height = m.height;
    this.cardsPadding = m.cardsPadding;
    this.cardWidth = m.cardWidth;
    this.cardHeight = m.cardHeight;
    this.cardsPerRow = m.cardsPerRow;
    this.cardBorder = m.cardBorder;
    this.viewType = m.viewType;
  }

  setViewType(view: ViewType) {
    if (view == this.viewType)
      return;

    this.viewType = view;
    this.delayedNotify({ type: 'resize' });
    this.delayedNotify({ type: 'select' });
  }

  getViewType() {
    return this.viewType;
  }

  setBodyBorder(border: boolean) {
    if (this.bodyBorder == border)
      return;

    this.bodyBorder = border;
    this.delayedNotify();
  }

  setCardBorder(border: boolean) {
    if (this.cardBorder == border)
      return;

    this.cardBorder = border;
    this.delayedNotify();
  }

  getCardBorder() {
    return this.cardBorder;
  }

  getBodyBorder() {
    return this.bodyBorder;
  }

  setSelectType(type: SelectType) {
    if (this.selectType == type)
      return;

    this.selectType = type;
    this.delayedNotify({ type: 'render' });
  }

  getSelectType() {
    return this.selectType;
  }

  setHeader(header: boolean) {
    if (header == this.header)
      return;

    this.header = header;
    this.delayedNotify({ type: 'render' });
  }

  getHeader() {
    return this.header;
  }

  getHeaderSize() {
    return this.headerHeight;
  }

  setRenderRange(firstRow: number, rowsCount: number) {
    this.firstRenderRow = firstRow;
    this.renderRowCount = rowsCount;
  }

  getRenderRange() {
    return {
      firstRow: this.firstRenderRow,
      rowCount: this.renderRowCount
    };
  }

  setReverse(reverse: boolean) {
    if (reverse == this.reverse)
      return false;

    this.reverse = reverse;
    this.getRowIdx = reverse ? this.reverseIdx : this.naturalIdx;
    this.delayedNotify({ type: 'scroll-top' });
    return true;
  }

  getReverse() {
    return this.reverse;
  }

  setAutosize(autosize: boolean) {
    if (this.autosize == autosize)
      return;

    this.autosize = autosize;
    this.delayedNotify({ type: 'resize' });
  }

  getAutosize() {
    return this.autosize;
  }

  setRowsCount(rowsCount: number) {
    if (this.rowsCount == rowsCount)
      return;

    this.rowsCount = rowsCount;
    this.delayedNotify({ type: 'resize' });
  }

  setColsCount(colsCount: number) {
    if (this.colsCount == colsCount)
      return;

    this.colsCount = colsCount;
    this.delayedNotify();
  }

  setSize(w: number, h: number) {
    if (this.width == w && this.height == h)
      return;

    this.width = w;
    this.height = h;
    this.delayedNotify({ type: 'resize' });
  }

  getHeight() {
    return this.height;
  }

  getWidth() {
    return this.width;
  }

  getRowsCount() {
    return this.rowsCount;
  }

  getColsCount() {
    return this.colsCount;
  }

  getColWidth = (col: { index: number }) => {
    const colWidth = this.columnWidth[col.index];
    if (colWidth != null)
      return colWidth;

    if (!this.width || !this.autosize)
      return this.defaultColWidth;

    return Math.floor((this.width - this.fixedWidth) / (this.colsCount - this.fixedCols));
  }

  isColFixed(col: number) {
    return this.columnWidth[col] != null;
  }

  getRowHeight = (row: { index: number }) => {
    if (this.header && row.index == 0)
      return this.headerHeight;

    return this.defaultRowHeight;
  }

  setRowSize(size: number) {
    if (this.defaultRowHeight == size)
      return;

    this.defaultRowHeight = size;
    this.delayedNotify({ type: 'resize-row' });
  }

  getRowSize() {
    return this.defaultRowHeight;
  }

  setHeaderSize(size: number) {
    if (size == this.headerHeight)
      return;

    this.headerHeight = size;
    this.delayedNotify({ type: 'resize-row' });
  }

  resetColSize(col: number) {
    delete this.columnWidth[col];
    this.recalcFixedSizes();
    this.delayedNotify({ type: 'resize' });
    this.delayedNotify({ type: 'col-resized' });
  }

  resetAllColSize() {
    this.columnWidth = [];
    this.recalcFixedSizes();
    this.delayedNotify({ type: 'resize' });
    this.delayedNotify({ type: 'col-resized' });
  }

  setColSize(col: number, size: number) {
    this.columnWidth[col] = size;
    this.recalcFixedSizes();
    this.delayedNotify({ type: 'resize' });
  }

  getRowFocus() {
    return this.focusRow;
  }

  getColFocus() {
    return this.focusCol;
  }

  isRowSelect(row: number): boolean {
    if (this.selectType == 'none')
      return;

    return this.selection[row] != null;
  }

  isCellSelect(row: number, col: number): boolean {
    if (this.selectType != 'cells')
      return false;

    const cells = this.selection[row];
    if (!cells)
      return false;
    return cells.has(col);
  }

  clearSelect() {
    let rowArr = Object.keys(this.selection);
    for (let n = 0; n < rowArr.length; n++) {
      if (!this.selection[ rowArr[n] ])
        continue;

      this.selection = {};
      this.delayedNotify({ type: 'select' });
      break;
    }
  }

  getSelectRows(): Array<number> {
    return Object.keys(this.selection).map(r => +r);
  }

  getSelectCells(): SelectCells {
    return this.selection;
  }

  setSelect(args: { row: number, col?: number, select: boolean, multiple?: boolean }) {
    if (this.selectType == 'none')
      return;

    const rowIdx = clamp(args.row, [0, this.rowsCount - 1]);
    let colIdx = args.col != null ? clamp(args.col, [0, this.colsCount - 1]) : null;
    if (this.selectType == 'rows')
      colIdx = null;

    const row = this.selection[rowIdx] || new Set();
    if (args.select) {
      if (colIdx == null && this.selection[rowIdx])
        return;
      else if (colIdx != null && row.has(colIdx))
        return;
    } else {
      if (colIdx == null && !this.selection[rowIdx])
        return;
      else if (colIdx != null && !row.has(colIdx))
        return;
    }

    if (!args.multiple) {
      row.clear();
      this.selection = {};
    }

    this.selection[rowIdx] = row;

    if (!args.select) {         // remove selection
      if (colIdx != null) {     // cell selection
        row.delete(colIdx);
      } else {                  // row selection
        delete this.selection[rowIdx];
      }
    } else {                    // add selection
      if (colIdx != null) {     // cell selection
        row.add(colIdx);
      } else {                  // row selection
        this.selection[rowIdx] = row;
      }
    }

    if (rowIdx != null)
      this.focusRow = args.row;

    if (colIdx != null)
      this.focusCol = colIdx;

    this.delayedNotify({ type: 'select' });
  }

  render() {
    this.delayedNotify({ type: 'render' });
  }

  private recalcFixedSizes() {
    this.fixedWidth = 0;
    this.fixedCols = 0;
    for (let c = 0; c < this.colsCount; c++) {
      const size = this.columnWidth[c];
      if (size == null)
        continue;

      this.fixedWidth += size;
      this.fixedCols++;
    }
  }
}
