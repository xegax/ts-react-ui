import { GridRequestorT, ColAndType } from './grid-view-model';
import { ViewResult, RowsArgs, RowsResult, ArrCell, ViewArgs, FilterCompound, FilterValue, FilterArgs } from './grid-requestor-decl';
import { clone } from '../common/common';

function createCmpStr(filter: FilterValue | FilterCompound) {
  if ('value' in filter)
    return `(row['${filter.column}'] == ${JSON.stringify(filter.value)})`;

  return filter.children.map(createCmpStr).join(filter.op == 'or' ? ' || ' : ' && ');
}

function createCmpFunc(filter: FilterArgs) {
  const f = `(function(row) { return ${createCmpStr(filter)}; })`;
  return (eval(f) as (row: Object) => boolean);
}

export abstract class GridRequestorBase implements GridRequestorT {
  protected viewArgsMap = new Map<string, ViewArgs>();
  protected viewIdCounter = 0;

  protected findViewId(args: ViewArgs) {
    let s1 = JSON.stringify(args);

    return Array.from(this.viewArgsMap.keys()).find(view => {
      return JSON.stringify(this.viewArgsMap.get(view)) == s1;
    });
  }

  protected createViewId(args: ViewArgs): string {
    this.viewIdCounter++;
    const viewId = 'v-' + this.viewIdCounter;
    this.viewArgsMap.set(viewId, args);
    return viewId;
  }

  abstract createView(args: ViewArgs): Promise<ViewResult>;
  abstract getRows(args: RowsArgs): Promise<RowsResult<ArrCell>>;
  abstract clearCache(): void;
}

interface ViewCache {
  colsIdx?: Array<number>;
  rowsIdx?: Array<number>;
}

interface ArraySource {
  rows: Array<Array<number | string>>;
  cols: Array<ColAndType>;
}
 
export class GridArrayRequestor extends GridRequestorBase {
  private viewCacheMap = new Map<string, ViewCache>();
  private distinctMap = new Map<string, GridArrayRequestor>();
  private source: ArraySource;

  constructor(source: ArraySource) {
    super();
    this.source = source;
  }

  clearCache() {
    this.distinctMap.clear();
    this.viewCacheMap.clear();
    this.viewArgsMap.clear();
    this.viewIdCounter = 0;
  }

  private distinctView(args: ViewArgs): Promise<ViewResult> {
    let srcId = this.findViewId({ distinct: args.distinct });
    if (!srcId) {
      srcId = this.createViewId({ distinct: args.distinct });
      const colIdx = this.source.cols.findIndex(c => c.name == args.distinct.column);
      let source: ArraySource = {
        cols: [{ name: 'value', type: this.source.cols[colIdx].type }, { name: 'count', type: 'integer' }],
        rows: []
      };
      let valueToRow = new Map<string | number, number>();
      for (let r = 0; r < this.source.rows.length; r++) {
        const val = this.source.rows[r][colIdx];
        if (valueToRow.has(val)) {
          const ridx = valueToRow.get(val);
          (source.rows[ridx][1] as number)++;
        } else {
          valueToRow.set(val, source.rows.length);
          source.rows.push([val, 1]);
        }
      }
      let dist = new GridArrayRequestor(source);
      this.distinctMap.set(srcId, dist);
    }

    const dist = this.distinctMap.get(srcId);
    delete args.distinct;
    return (
      dist.createView(args)
      .then(res => {
        return {
          ...res,
          viewId: [srcId, res.viewId].join('#')
        };
      })
    );
  }

  createView(args: ViewArgs): Promise<ViewResult> {
    args = clone(args);
    if (args.distinct)
      return this.distinctView(args);

    let viewId = this.findViewId(args);
    let res: ViewResult = {
      viewId: '?',
      desc: {}
    };

    if (!viewId) {
      let view: ViewCache = {
        rowsIdx: this.source.rows.map((_, i) => i)
      };

      if (args.filter && args.filter.children?.length) {
        const cmp = createCmpFunc(args.filter);

        view.rowsIdx = [];
        for (let n = 0; n < this.source.rows.length; n++) {
          const row = {};
          this.source.rows[n].forEach((v, cidx) => {
            row[this.source.cols[cidx].name] = v;
          });

          if (cmp(row))
            view.rowsIdx.push(n);
        }
      }

      if (args.columns) {
        const cols = new Set(this.source.cols.map(c => c.name));
        view.colsIdx = args.columns.filter(c => cols.has(c)).map(c => this.source.cols.findIndex(ct => ct.name == c));
      }

      if (args.sorting && args.sorting.cols.length) {
        const sortCols: Array<{ idx: number; asc: boolean }> = [];
        args.sorting.cols.forEach(sortCol => {
          const idx = this.source.cols.findIndex(c => c.name == sortCol.name);
          if (idx != -1)
            sortCols.push({ idx, asc: sortCol.asc });
        });

        if (sortCols.length) {
          view.rowsIdx.sort((r1, r2) => {
            for (let n = 0; n < sortCols.length; n++) {
              const col = sortCols[n];
              const v1 = this.source.rows[r1][col.idx];
              const v2 = this.source.rows[r2][col.idx];
              if (v1 < v2)
                return col.asc ? -1 : 1;

              if (v1 > v2)
                return col.asc ? 1 : -1;
            }

            return 0;
          });
        }
      }

      viewId = this.createViewId(args);
      this.viewCacheMap.set(viewId, view);
    }

    const view = this.viewCacheMap.get(viewId);
    res.viewId = viewId;
    res.desc.columns = (view.colsIdx ? view.colsIdx.map(c => this.source.cols[c]) : this.source.cols).map(c => c.name);
    res.desc.rows = view.rowsIdx ? view.rowsIdx.length : this.source.rows.length;

    return Promise.resolve(res);
  }

  getRows(args: RowsArgs): Promise<RowsResult<ArrCell>> {
    const vid = args.viewId.split('#');
    if (vid.length == 2)
      return this.distinctMap.get(vid[0]).getRows({...args, viewId: vid[1] });

    const view = this.viewCacheMap.get(args.viewId);
    const res: RowsResult<ArrCell> = {
      rows: []
    };

    let rowIdx = Array<number>();
    if (view.rowsIdx) {
      rowIdx = view.rowsIdx.slice(args.from, args.from + args.count);
    } else {
      rowIdx = Array(Math.min(args.count, this.source.rows.length)).fill(0).map((_, idx) => args.from + idx);
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
