import { Publisher } from 'objio/common/publisher';
import { clamp } from '../common/common';

export type EventType = 'resize' | 'render' | 'select';

export class GridModel extends Publisher<EventType> {
  private defaultColWidth = 100;
  private defaultRowHeight = 30;

  private columnWidth: { [colIdx: number]: number } = {};
  private fixedWidth: number = 0;
  private fixedCols: number = 0;
  private width: number = 0;
  private height: number = 0;

  private rowsCount = 0;
  private colsCount = 0;
  private autosize = true;
  private reverse = false;
  private rowSelect = new Set<number>();
  private colSelect =  new Set<number>();
  private focusRow = -1;
  private firstRenderRow: number = 0;
  private renderRowCount: number = 0;
  private header: boolean = true;

  private naturalIdx = (idx: number) => idx;
  private reverseIdx = (idx: number) => this.rowsCount - idx - 1;
  getRowIdx = this.naturalIdx;

  setHeader(header: boolean) {
    if (header == this.header)
      return;

    this.header = header;
    this.delayedNotify({ type: 'render' });
  }

  getHeader() {
    return this.header;
  }

  setRenderRange(firstRow: number, rowsCount: number) {
    this.firstRenderRow = firstRow;
    this.renderRowCount = rowsCount;
  }

  getRenderRange() {
    return {
      firstRow: this.firstRenderRow,
      rowCount: this.header ? this.renderRowCount - 1 : this.renderRowCount
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
    return this.defaultRowHeight;
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

  isRowSelect(row: number): boolean {
    return this.rowSelect.has(row);
  }

  isColSelect(col: number): boolean {
    return this.colSelect.has(col);
  }

  isCellSelect(row: number, col: number): boolean {
    return this.rowSelect.has(row) && this.colSelect.has(col);
  }

  clearSelect() {
    if (!this.rowSelect.size && !this.colSelect.size)
      return;

    this.rowSelect.clear();
    this.colSelect.clear();

    this.delayedNotify({ type: 'select' });
  }

  setSelect(args: { row?: number, col?: number, select: boolean, multiple?: boolean }) {
    let change = 0;
    [
      { set: this.rowSelect, idx: args.row, max: this.rowsCount - 1 },
      { set: this.colSelect, idx: args.col, max: this.colsCount - 1 }
    ].forEach(p => {
      if (p.idx == null)
        return;

      const idx = clamp(p.idx, [0, p.max]);
      const hasIdx = p.set.has(idx);
      if (!args.select && !hasIdx || args.select && hasIdx)
        return;

      if (args.select) {
        if (!args.multiple)
          this.clearSelect();
        p.set.add(idx);
      } else {
        p.set.delete(idx);
      }

      change++;
    });

    if (!change)
      return;

    if (args.row != null)
      this.focusRow = args.row;

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
