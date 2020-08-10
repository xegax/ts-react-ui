import { GridRequestorT } from './grid-view-model';
import { ViewArgsT, ViewResult, RowsArgs, RowsResult, ArrCell } from './grid-requestor-decl';
import { clone } from '../common/common';

export abstract class GridRequestorBase implements GridRequestorT {
  protected viewArgsMap = new Map<string, ViewArgsT>();
  protected viewIdCounter = 0;

  protected findViewId(args: ViewArgsT) {
    let s1 = JSON.stringify(args);

    return Array.from(this.viewArgsMap.keys()).find(view => {
      return JSON.stringify(this.viewArgsMap.get(view)) == s1;
    });
  }

  protected createViewId(args: ViewArgsT): string {
    this.viewIdCounter++;
    const viewId = 'v-' + this.viewIdCounter;
    this.viewArgsMap.set(viewId, args);
    return viewId;
  }

  abstract createView(args: ViewArgsT): Promise<ViewResult>;
  abstract getRows(args: RowsArgs): Promise<RowsResult<ArrCell>>;
  abstract clearCache(): void;
}

interface ViewCache {
  colsIdx?: Array<number>;
  rowsIdx?: Array<number>;
}

interface ArraySource {
  rows: Array<Array<number | string>>;
  cols: Array<string>;
}

export class GridArrayRequestor extends GridRequestorBase {
  private viewCacheMap = new Map<string, ViewCache>();
  private source: ArraySource;

  constructor(source: ArraySource) {
    super();
    this.source = source;
  }

  clearCache() {
    this.viewCacheMap.clear();
    this.viewArgsMap.clear();
    this.viewIdCounter = 0;
  }

  createView(args: ViewArgsT): Promise<ViewResult> {
    args = clone(args);
    let viewId = this.findViewId(args);
    let res: ViewResult = {
      viewId: '?',
      desc: {}
    };

    if (!viewId) {
      let view: ViewCache = {};
      if (args.columns) {
        const cols = new Set(this.source.cols);
        view.colsIdx = args.columns.filter(c => cols.has(c)).map(c => this.source.cols.indexOf(c));
      }

      if (args.sorting && args.sorting.cols.length) {
        const reverse = false;
        const cidx = this.source.cols.findIndex(c => c == args.sorting.cols[0].name);
        if (cidx != -1) {
          view.rowsIdx = this.source.rows.map((_, i) => i);
          view.rowsIdx.sort((r1, r2) => {
            const v1 = this.source.rows[r1][cidx];
            const v2 = this.source.rows[r2][cidx];
            if (v1 < v2)
              return reverse ? 1 : -1;

            if (v1 > v2)
              return reverse ? -1 : 1;

            return 0;
          });
        }
      }

      viewId = this.createViewId(args);
      this.viewCacheMap.set(viewId, view);
    }

    const view = this.viewCacheMap.get(viewId);
    res.viewId = viewId;
    res.desc.columns = view.colsIdx ? view.colsIdx.map(c => this.source.cols[c]) : this.source.cols;
    res.desc.rows = view.rowsIdx ? view.rowsIdx.length : this.source.rows.length;

    return Promise.resolve(res);
  }

  getRows(args: RowsArgs): Promise<RowsResult<ArrCell>> {
    const view = this.viewCacheMap.get(args.viewId);
    const res: RowsResult<ArrCell> = {
      rows: []
    };

    let rowIdx = Array<number>();
    if (view.rowsIdx) {
      rowIdx = view.rowsIdx.slice(args.from, args.from + args.count);
    } else {
      rowIdx = Array(args.count).fill(0).map((_, idx) => args.from + idx);
    }

    res.rows = rowIdx.map(ridx => {
      const row = this.source.rows[ridx];
      if (!view.colsIdx)
        return row;

      return view.colsIdx.map(c => row[c]);
    });

    return Promise.resolve(res);
  }
}
