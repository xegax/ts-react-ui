import { GridModel } from './grid-model';

export interface Row<T = Object> {
  obj: T;
  error?: boolean;
}
export interface Row1 {
  cell: Array<string | number>;
  error?: boolean;
}
export interface Row2<T = Object> {
  obj: T;
  cell: Array<string | number>;
  error?: boolean;
}

export interface RowBlock<T = Object> {
  row: Array<Row2<T>>;
  task?: Promise<void>;
}

export type Loader<T = Object> = (from: number, count: number) => Promise<Array< Row<T> | Row1 | Row2<T> >>;

export class GridLoadableModel<T = Object> extends GridModel {
  private rowBlock: {[block: number]: RowBlock<T>} = {};
  private rowsPerBlock = 50;
  private loadedRows: number = 0;
  private loader: Loader<T>;

  setRowsCount(count: number) {
    if (this.rowsCount == count)
      return;

    this.loadedRows = Math.min(this.loadedRows, count);
    super.setRowsCount(count);
  }

  setReverse(reverse: boolean) {
    if (this.reverse == reverse)
      return false;

    this.reverse = reverse;
    this.loadBlock({ block: 0, invalidate: true });
    this.delayedNotify({ type: 'scroll-top' });
    return true;
  }

  setLoader(loader: Loader<T>) {
    if (this.loader == loader)
      return;

    this.loader = loader;
    this.loadBlock({ block: 0 });
  }

  getRowFocus(considerReverse: boolean = false) {
    let row = super.getRowFocus();
    if (considerReverse && this.reverse)
      row = this.reverseIdx(row);
    return row;
  }

  getRow(row: number): Row2<T> {
    const bIdx = Math.floor(row / this.rowsPerBlock);
    const block = this.rowBlock[bIdx];
    if (!block)
      return null;

    return block.row[row - bIdx * this.rowsPerBlock];
  }

  getRowOrLoad(row: number) {
    const r = this.getRow(row);
    if (!r)
      this.loadBlock({ block: Math.floor(row / this.rowsPerBlock) });

    return r;
  }

  loadNext() {
    this.getRowOrLoad(this.loadedRows);
  }

  reload() {
    this.loadBlock({ block: 0, invalidate: true });
    this.delayedNotify({ type: 'scroll-top' });
  }

  reloadCurrent() {
    const range = this.getRenderRange();
    const fb = Math.floor(range.firstRow / this.rowsPerBlock);
    const eb = Math.floor((range.firstRow + range.rowCount) / this.rowsPerBlock);
    let tasks = Array<Promise<void>>();
    for (let b = fb; b <= eb; b++) {
      tasks.push(this.loadBlock({ block: b }));
      console.log('reload block', b);
    }

    Promise.all(tasks)
    .then(() => {
      Object.keys(this.rowBlock).forEach(b => {
        if (+b >= fb && +b <= eb)
          return;
        this.rowBlock[b] = {};
      });

      this.notify('render');
    });
  }

  private loadBlock(args: { block: number, invalidate?: boolean }): Promise<void> {
    let block = this.rowBlock[args.block] || (this.rowBlock[args.block] = { row: [] });
    if (block && block.task)
      return block.task;

    let from = args.block * this.rowsPerBlock;
    let naturalFrom = from;
    const count = Math.min(from + this.rowsPerBlock, this.rowsCount) - from;
    if (count == 0)
      return Promise.resolve();

    if (this.reverse)
      from = this.reverseIdx(from + count - 1);

    console.log(`load ${from}(${count}) ${block}`);
    block.task = this.loader(from, count)
    .then(row => {
      if (args.invalidate) {
        this.loadedRows = 0;
        this.rowBlock = {
          [args.block]: block
        };
      }

      row = this.reverse ? row.reverse() : row;
      block.row = [];
      row.forEach(r => {
        const r2 = r as Row2<T>;
        if (!r2.obj && !r2.cell)
          throw new Error('obj and cell not defined for row');

        let resRow: Row2<T> = { ...r2 };
        if (r2.obj && !r2.cell)
          resRow.cell = Object.keys(r2.obj).map(key => r2.obj[key]);

        if (r2.cell && r2.cell.length != this.colsCount)
          throw new Error('row.cell.length should be equals to colsCount');

        block.row.push(resRow);
      });
      block.task = null;
      this.loadedRows = Math.max(this.loadedRows, naturalFrom + count);
      this.notify('render');
    })
    .catch(() => {
      let row = Array<Row2<T>>();
      while (row.length < count) {
        row.push({
          cell: Array(this.colsCount).fill('#err'),
          obj: {} as any,
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
