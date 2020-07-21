import { Publisher } from "objio";
import { GridLoadableModel, Loader } from './grid-loadable-model';
import { GridRequestor, WrapperArgs, ArrCell, ViewArgs } from './grid-requestor-decl';

export type EventType = string;
export type GridRequestorT = GridRequestor<WrapperArgs<string, any>, ArrCell>;

function reorder(row: Array<any>, order: Array<number>) {
  return order.map(idx => row[idx]);
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

  constructor() {
    super();

    this.grid.setLoader(this.loader);
  }

  setRequestor(req: GridRequestorT) {
    this.req = req;
    this.viewId = undefined;
    this.viewArgs = {
      descAttrs: ['rows', 'columns']
    };

    this.updateViewId();
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

  toggleSorting(column: string) {
    const sorting = {
      cols: [ column ],
      reverse: false
    };
    sorting.reverse = JSON.stringify(sorting) == JSON.stringify(this.viewArgs.sorting);
    this.viewArgs.sorting = sorting;

    this.updateViewId();
  }

  hideColumn(column: string) {
    this.viewArgs.columns = this.viewCols.filter(c => c != column);
    this.updateViewId();
  }

  showAllColumns() {
    delete this.viewArgs.columns;
    this.updateViewId();
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

  private updateViewId() {
    if (this.updViewTask)
      this.updViewTask.cancel();

    this.updViewTask = (
      this.req.createView(this.viewArgs)
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
  }
}
