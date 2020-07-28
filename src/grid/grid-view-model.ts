import { Publisher } from "objio";
import { GridLoadableModel, Loader } from './grid-loadable-model';
import { GridRequestor, WrapperArgs, ArrCell, ViewArgs } from './grid-requestor-decl';
import { GridViewAppr, getGridViewApprDefault, GridSortAppr } from './grid-view-appr';
import { ApprObject } from '../common/appr-object';
import { isEquals } from '../common/common';
import { SelectType } from './grid-model';
import { GridView } from "./grid-view";

export type EventType = string;
export type GridRequestorT = GridRequestor<WrapperArgs<string, any>, ArrCell>;

interface GridViewArgs {
  selType: SelectType;
}

export class GridViewModel extends Publisher<EventType> {
  private grid = new GridLoadableModel();
  private req?: GridRequestorT;
  private viewId?: string;
  private updViewTask?: Promise<void>;
  private viewArgs: ViewArgs< WrapperArgs<string, any> > = {
    descAttrs: ['rows', 'columns']
  };
  private allCols = Array<string>();
  private viewCols = Array<string>();
  private appr = new ApprObject<GridViewAppr>(getGridViewApprDefault());

  constructor(args?: GridViewArgs) {
    super();

    this.grid.setLoader(this.loader);
    this.grid.subscribe(() => {
      const appr = this.appr.get();
      for (let c = 0; c < this.grid.getColsCount(); c++) {
        const col = this.viewCols[c];
        const currWidth = appr.columns[col]?.width;
        if (this.grid.isColFixed(c)) {
          const width = this.grid.getColWidth({ index: c });
          if (currWidth == width)
            continue;

          this.appr.set({ columns: { [col]: { width } }});
        } else {
          if (currWidth == null)
            continue;
          this.appr.set({ columns: { [col]: { width: null } }});
        }
      }
    }, 'col-resized');

    if (args) {
      this.grid.setSelectType(args.selType);
    }
  }

  setDefaultAppr(appr: GridViewAppr) {
    this.appr = new ApprObject<GridViewAppr>(appr);
  }

  getAppr() {
    return this.appr.get();
  }

  getApprChange() {
    return this.appr.getChange();
  }

  setApprChange(appr: Partial<GridViewAppr>) {
    this.appr.resetToDefault();
    this.appr.set(appr);

    this.updateViewArgs(false);
  }

  setRequestor(req: GridRequestorT) {
    this.req = req;
    this.viewId = undefined;
    this.appr.resetToDefault();

    this.updateViewArgs(true);
  }

  getGrid() {
    return this.grid;
  }

  getRequestor() {
    return this.req;
  }

  reload() {
    this.grid.reload();
  }

  getViewColumns() {
    return this.viewCols;
  }

  getAllColumns() {
    return this.allCols;
  }

  private updateViewArgs(force: boolean) {
    const appr = this.appr.get();
    const sortCols = appr.sort.columns;

    this.grid.setHeader(appr.header.show);
    this.grid.setHeaderSize(appr.header.font.sizePx + appr.header.padding * 2);
    
    let rowSize = appr.body.font.sizePx;
    this.grid.resetAllColSize();
    this.viewCols.forEach((c, i) => {
      const col = appr.columns[c];
      if (!col)
        return;

      if (col.font && col.font.sizePx)
        rowSize = Math.max(col.font.sizePx, rowSize);
    });
    this.grid.setRowSize(rowSize + appr.body.padding * 2);

    const viewArgs: ViewArgs< WrapperArgs<string, any> > = {
      descAttrs: ['rows', 'columns']
    };

    if (sortCols.length || appr.sort.reverse) {
      viewArgs.sorting = {
        cols: appr.sort.columns,
        reverse: appr.sort.reverse
      };
    }

    if (appr.colsOrder.length) {
      const allCols = new Set(this.allCols);
      const cols = appr.colsOrder.filter(c => allCols.has(c));
      if (cols.length)
        viewArgs.columns = cols;
    }

    this.updateViewId(viewArgs, force)
    .then(() => {
      this.viewCols.forEach((c, i) => {
        const col = appr.columns[c];
        if (!col)
          return;
  
        if (col.width)
          this.grid.setColSize(i, col.width);
      });
    });
  }

  moveColumnTo(col: string, relCol: string, type: 'before' | 'after') {
    let rcolIdx = this.viewCols.indexOf(relCol);
    if (rcolIdx == -1)
      return;

    if (type == 'after')
      rcolIdx++;

    const colsOrder = this.viewCols.filter(c => c != col);
    colsOrder.splice(rcolIdx, 0, col);
    this.appr.set({ colsOrder });

    this.updateViewArgs(false);
  }

  moveColumnTo2(col: string, type: 'start' | 'end') {
    const colsOrder = this.viewCols.filter(c => c != col);
    if (type == 'end')
      colsOrder.push(col);
    else
      colsOrder.splice(0, 0, col);

    this.appr.set({ colsOrder });
    this.updateViewArgs(false);
  }

  toggleSorting(column: string) {
    const prevSort = this.appr.get().sort;
    const sort: GridSortAppr = {
      columns: [{ name: column, asc: true }],
      reverse: false
    };
    sort.reverse = isEquals(sort, prevSort);
    this.appr.set({ sort });

    this.updateViewArgs(false);
  }

  showColumn(column: string, show: boolean) {
    let colsOrder = this.viewCols.filter(c => c != column);
    if (show)
      colsOrder.push(column);

    this.appr.set({ colsOrder });

    this.updateViewArgs(false);
  }

  showAllColumns() {
    this.appr.set({ colsOrder: undefined });

    this.updateViewArgs(false);
  }

  setColumnLabel(name: string, label?: string) {
    this.appr.set({ columns: {[name]: { label }} });
    this.grid.delayedNotify({ type: 'render' });
  }

  private loader: Loader<any> = (from: number, count: number) => {
    if (!this.req || !this.viewId)
      return Promise.resolve([]);

    return (
      this.req.getRows({ viewId: this.viewId, from, count })
      .then(res => {
        return res.rows.map(row => {
          return { cell: row };
        });
      })
    );
  };

  private updateViewId(view: ViewArgs< WrapperArgs<string, any> >, force: boolean) {
    if (!force && isEquals(view, this.viewArgs))
      return Promise.resolve();

    if (this.updViewTask)
      this.updViewTask.cancel();

    this.viewArgs = view;
    this.updViewTask = (
      this.req.createView(view)
      .then(res => {
        this.updViewTask = undefined;
        if (this.viewId == res.viewId)
          return;

        if (!this.viewId) {
          this.allCols = res.desc.columns;
          this.viewCols = this.allCols.slice();
        } else {
          this.viewCols = res.desc.columns;
        }

        this.viewId = res.viewId;
        console.log(res.viewId);

        this.grid.setRowsCount(res.desc.rows);
        this.grid.setColsCount(this.viewCols.length);

        this.grid.reload();
        this.grid.delayedNotify({ type: 'resize' });
        this.delayedNotify();
      })
    );

    return this.updViewTask;
  }
}
