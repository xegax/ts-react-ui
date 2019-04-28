import { GridModel } from './grid-model';

export interface Row<T = Object> {
  raw?: T;
  col: Array<string>;
  error?: boolean;
}

export interface RowBlock {
  row: Array<Row>;
  task?: Promise<void>;
}

export type Loader<T = Object> = (from: number, count: number) => Promise<Array<Row<T>>>;

export class GridLoadableModel<T = Object> extends GridModel {
  private rowBlock: {[block: number]: RowBlock} = {};
  private rowsPerBlock = 50;
  private loadedRows: number = 0;
  private loader: Loader<T>;

  setLoader(loader: Loader<T>) {
    if (this.loader == loader)
      return;

    this.loader = loader;
    this.loadBlock(0);
  }

  getRow(row: number): Row {
    const bIdx = Math.floor(row / this.rowsPerBlock);
    const block = this.rowBlock[bIdx];
    if (!block)
      return null;

    return block.row[row - bIdx * this.rowsPerBlock];
  }

  getRowOrLoad(row: number) {
    const r = this.getRow(row);
    if (!r)
      this.loadBlock(Math.floor(row / this.rowsPerBlock));

    return r;
  }

  loadNext() {
    this.getRowOrLoad(this.loadedRows);
  }

  private loadBlock(bIdx: number): Promise<void> {
    let block = this.rowBlock[bIdx] || (this.rowBlock[bIdx] = { row: [] });
    if (block && block.task)
      return block.task;

    const from = bIdx * this.rowsPerBlock;
    const count = Math.min(from + this.rowsPerBlock, this.rowsCount) - from;
    block.task = this.loader(from, count)
    .then(row => {
      block.row = row;
      block.task = null;
      this.loadedRows = Math.max(this.loadedRows, from + count);
      this.delayedNotify({ type: 'render' });
    })
    .catch(() => {
      let row = Array<Row<T>>();
      while (row.length < count) {
        row.push({
          col: Array(this.colsCount).fill('#err'),
          raw: {} as any,
          error: true
        });
      }
      block.row = row;
      block.task = null;
      this.delayedNotify({ type: 'render' });
    });

    return block.task;
  }

  getRowsCount() {
    return this.loadedRows;
  }
}
