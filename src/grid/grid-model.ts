import { Publisher } from 'objio/common/publisher';
import { clamp } from '../common/common';

export type EventType = 'resize' | 'render' | 'select' | 'resize-row';
export type SelectType = 'none' | 'rows' | 'cells';
export type SelectCells = {[row: number]: Set<number>};

export class GridModel extends Publisher<EventType> {
  private defaultColWidth = 100;
  private defaultRowHeight = 30;
  private headerHeight = 50;

  private columnWidth: { [colIdx: number]: number } = {};
  private fixedWidth: number = 0;
  private fixedCols: number = 0;
  private width: number = 0;
  private height: number = 0;

  private rowsCount = 0;
  private colsCount = 0;
  private autosize = true;
  private reverse = false;
  private selection: SelectCells = {};
  private focusRow = -1;
  private focusCol = -1;
  private firstRenderRow: number = 0;
  private renderRowCount: number = 0;
  private header: boolean = true;
  private selectType: SelectType = 'cells';

  private naturalIdx = (idx: number) => idx;
  private reverseIdx = (idx: number) => this.rowsCount - idx - 1;
  getRowIdx = this.naturalIdx;

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
      return;

    this.reverse = reverse;
    this.getRowIdx = reverse ? this.reverseIdx : this.naturalIdx;
    this.delayedNotify({ type: 'render' });
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
