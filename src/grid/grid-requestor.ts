import { GridRequestorT, ColAndType, ColType } from './grid-view-model';
import {
  ViewResult,
  RowsArgs,
  RowsResult,
  ArrCell,
  ViewArgs,
  FilterCompound,
  FilterValue,
  FilterArgs,
  AggFuncType
} from './grid-requestor-decl';
import { clone } from '../common/common';


function createCmpStr(filter: FilterArgs) {
  if ('value' in filter)
    return `(row['${filter.column}'] == ${JSON.stringify(filter.value)})`;

  if ('range' in filter)
    return `(row['${filter.column}'] >= ${filter.range[0]} && row['${filter.column}'] <= ${filter.range[1]})`;

  return `(${filter.children.map(createCmpStr).join(filter.op == 'or' ? ' || ' : ' && ')})`;
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
  private aggMap = new Map<string, GridArrayRequestor>();
  private source: ArraySource;

  constructor(source: ArraySource) {
    super();
    this.source = source;
  }

  clearCache() {
    this.distinctMap.clear();
    this.aggMap.clear();
    this.viewCacheMap.clear();
    this.viewArgsMap.clear();
    this.viewIdCounter = 0;
  }

  private aggView(args: ViewArgs): Promise<ViewResult> {
    const vargs: ViewArgs = {
      aggregate: args.aggregate
    };

    if (args.viewId)
      vargs.viewId = args.viewId;

    let srcId = this.findViewId(vargs);
    if (!srcId) {
      srcId = this.createViewId(vargs);

      let rowsNum = this.source.rows.length;
      let rows = this.source.rows;
      let cols = this.source.cols;
      if (args.viewId) {
        const cache = this.viewCacheMap.get(args.viewId);
        if (cache && cache.rowsIdx) {
          rowsNum = cache.rowsIdx.length;
          rows = cache.rowsIdx.map(idx => rows[idx]);
        }
      }

      const colTypeMap = new Map<string, ColType>();
      args.aggregate.columns.forEach(col => {
        const c = cols.find(c => c.name == col);
        if (c)
          colTypeMap.set(c.name, c.type);
      });

      let source: ArraySource = {
        cols: [
          { name: 'name', type: 'string' },
          { name: 'min', type: 'numeric' },
          { name: 'max', type: 'numeric' },
          { name: 'sum', type: 'numeric' }
        ],
        rows: []
      };

      for (let c = 0; c < args.aggregate.columns.length; c++) {
        const colIdx = cols.findIndex(col => col.name == args.aggregate.columns[c]);
        if (colIdx == -1)
          continue;

        let aggRow: Partial<{ name: string; min: number; max: number; sum: number }> = {
          name: cols[colIdx].name
        };

        for (let a = 1; a < source.cols.length; a++) {
          const f = createAggFunc(source.cols[a].name as AggFuncType, aggRow);
          for (let r = 0; r < rowsNum; r++)
            f.append(rows[r][colIdx]);
          f.commit();
        }
        source.rows.push( source.cols.map(c => aggRow[c.name]) );
      }
      let aggReq = new GridArrayRequestor(source);
      this.aggMap.set(srcId, aggReq);
    }

    const aggReq = this.aggMap.get(srcId);
    delete args.aggregate;
    return (
      aggReq.createView(args)
      .then(res => {
        return {
          ...res,
          viewId: [srcId, res.viewId].join('#')
        };
      })
    );
  }

  private distinctView(args: ViewArgs): Promise<ViewResult> {
    const vargs: ViewArgs = {
      distinct: args.distinct
    };

    if (args.viewId)
      vargs.viewId = args.viewId;

    let srcId = this.findViewId(vargs);
    if (!srcId) {
      srcId = this.createViewId(vargs);

      let rowsNum = this.source.rows.length;
      let rows = this.source.rows;
      let cols = this.source.cols;
      if (args.viewId) {
        const cache = this.viewCacheMap.get(args.viewId);
        if (cache && cache.rowsIdx) {
          rowsNum = cache.rowsIdx.length;
          rows = cache.rowsIdx.map(idx => rows[idx]);
        }
      }

      const colIdx = cols.findIndex(c => c.name == args.distinct.column);
      let source: ArraySource = {
        cols: [{ name: 'value', type: this.source.cols[colIdx].type }, { name: 'count', type: 'integer' }],
        rows: []
      };
      let valueToRow = new Map<string | number, number>();
      for (let r = 0; r < rowsNum; r++) {
        const val = rows[r][colIdx];
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

    if (args.aggregate)
      return this.aggView(args);

    let viewId = this.findViewId(args);
    let res: ViewResult = {
      viewId: '?',
      desc: {}
    };

    if (!viewId) {
      let view: ViewCache = {
        rowsIdx: this.source.rows.map((_, i) => i)
      };

      if (args.filter) {
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
    if (vid.length == 2) {
      return (
        this.distinctMap.get(vid[0]) || this.aggMap.get(vid[0])
      ).getRows({...args, viewId: vid[1] });
    }

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

function createAggFunc(type: AggFuncType, ctx: any) {
  let count = 0;
  return {
    append: (value: number | string) => {
      if (count == 0) {
        if (type == 'min' || type == 'max' || type == 'sum')
          ctx[type] = value;
      } else {
        if (type == 'min')
          ctx[type] = Math.min(ctx[type], value as number);
        else if (type == 'max')
          ctx[type] = Math.max(ctx[type], value as number);
        else if (type == 'sum')
          ctx[type] += value;
      }

      count++;
    },
    commit: () => {
    }
  };
}
