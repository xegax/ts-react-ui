import { Publisher } from 'objio';
import { GridLoadableModel, Loader } from './grid-loadable-model';
import { GridRequestor, ArrCell, ViewArgs, FilterArgs } from './grid-requestor-decl';
import { GridViewAppr, getGridViewApprDefault, GridSortAppr } from './grid-view-appr';
import { ApprObject } from '../common/appr-object';
import { isEquals } from '../common/common';
import { SelectType } from './grid-model';
import { clone } from "../common/common";
import { FilterPanel } from '../panel/filter-panel';
import {
  FiltersMap,
  GetValuesArgs,
  GetRangeArgs,
  SortType,
  getCatFilter,
  getRangeFilter,
  ColItem,
  Value,
  FilterHolder,
  DBColType
} from '../panel/filter-panel-decl';
import { BoxLayoutEditorModel } from '../box-layout/box-layout-editor-model';
import { getTextFilter } from '../panel/filter-panel-decl';

export type EditorMode = 'grid' | 'card-editor';
export type EventType = string;
export type GridRequestorT = GridRequestor<ArrCell>;
export type ColType = 'integer' | 'numeric' | 'string' | 'text';
export interface ColAndType {
  name: string;
  type: ColType;
}

interface GridViewArgs {
  selType: SelectType;
}

let linkTgtCounter = 0;
export class GridViewModel extends Publisher<EventType> {
  private grid = new GridLoadableModel();
  private req?: GridRequestorT;
  private viewId?: string;
  private updViewTask?: Promise<void>;
  private viewArgs: ViewArgs = {
    descAttrs: ['rows', 'columns']
  };
  private colTypes = new Map<string, ColType>(); 
  private allTableCols = Array<string>();
  private allFilterCols = Array<string>();
  private viewCols = Array<string>();
  private appr = new ApprObject<GridViewAppr>(getGridViewApprDefault());
  private filters?: FilterArgs;
  private filterPanel = new FilterPanel([]);
  private mode: EditorMode = 'grid';
  private editRow: number = 0;
  private cardEditor = new BoxLayoutEditorModel();
  private linkTgt = 'link-tgt-' + (++linkTgtCounter);

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

  getLinkTgt() {
    return this.linkTgt;
  }

  setDefaultAppr(appr: GridViewAppr) {
    this.appr = new ApprObject<GridViewAppr>(appr);
    this.filterPanel.setFilters(this.appr.get().filters as FiltersMap);
  }

  getAppr() {
    return this.appr.get();
  }

  getApprRef(): Pick<ApprObject<GridViewAppr>, 'isModified' | 'getChange'> {
    return this.appr;
  }

  modifyAppr(callback: (appr: ApprObject<GridViewAppr>) => void) {
    callback(this.appr);
    this.delayedNotify();
    this.updateViewArgs(false);
  }

  setApprChange(appr: Partial<GridViewAppr>) {
    this.modifyAppr(ref => {
      ref.set(appr);
    });
  }

  setFilters(filters?: FilterArgs) {
    if (isEquals(filters, this.filters))
      return;

    this.filters = filters;
    this.updateViewArgs(true);
  }

  setRequestor(req: GridRequestorT) {
    this.req = req;
    this.viewId = undefined;
    this.updateViewArgs(true);
  }

  getGrid() {
    return this.grid;
  }

  getFiltersPanel() {
    return this.filterPanel;
  }

  getRequestor() {
    return this.req;
  }

  setEditorMode(mode: EditorMode) {
    if (this.mode == mode)
      return;

    this.mode = mode;
    if (this.mode == 'grid') {
      this.setApprChange({ cardsView: { boxArr: this.cardEditor.getBoxArr() } });
    }
  
    this.delayedNotify();
  }

  getEditorMode() {
    return this.mode;
  }

  getEditRow() {
    return this.editRow;
  }

  setEditRow(row: number) {
    if (this.editRow == row)
      return;

    this.editRow = row;
    this.delayedNotify();
  }

  getCardEditor() {
    return this.cardEditor;
  }

  reload() {
    this.grid.reload();
  }

  getViewColumns() {
    return this.viewCols;
  }

  getAllColumns() {
    return this.allTableCols;
  }

  getAllColumnsForFilter() {
    return this.allFilterCols;
  }

  setAllColumns(cols: Array<ColAndType>, filterCols?: Array<ColAndType>) {
    this.colTypes.clear();
    cols.forEach(col => {
      this.colTypes.set(col.name, col.type);
    });
    this.viewCols = this.allTableCols = cols.map(c => c.name);

    if (filterCols) {
      filterCols.forEach(col => {
        this.colTypes.set(col.name, col.type);
      });
      this.allFilterCols = filterCols.map(c => c.name);
    } else {
      this.allFilterCols = this.allTableCols.slice();
    }

    updateFilterColumns(this);

    this.delayedNotify();
    this.delayedNotify({ type: 'columns' });
  }

  getColType(col: string) {
    return this.colTypes.get(col) || 'string';
  }

  reloadCurrent(args: { clearCache: boolean } = { clearCache: true }) {
    if (args?.clearCache)
      this.req.clearCache();

    this.viewId = undefined;
    this.updateViewArgs(true);
  }

  updateData() {
    this.grid.reloadCurrent();
  }

  private updateViewArgs(force: boolean) {
    const appr = this.appr.get();

    this.grid.setHeader(appr.header.show);
    this.grid.setBodyBorder(appr.body.border);
    this.grid.setHeaderSize(appr.header.font.sizePx + appr.header.padding * 2);
    
    this.grid.setCardWidth(appr.cardsView.width);
    this.grid.setCardHeight(appr.cardsView.height);
    this.grid.setCardBorder(appr.cardsView.border);
    this.grid.setCardsPadding(appr.cardsView.padding);
    this.grid.setViewType(appr.viewType);
    
    let rowSize = appr.body.font.sizePx;
    this.viewCols.forEach((c, i) => {
      const col = appr.columns[c];
      if (!col)
        return;

      if (col.font && col.font.sizePx)
        rowSize = Math.max(col.font.sizePx, rowSize);
    });
    this.grid.setRowSize(rowSize + appr.body.padding * 2);

    const viewArgs: ViewArgs = {
      filter: this.filters,
      descAttrs: ['rows', 'columns']
    };

    viewArgs.sorting = clone({
      cols: appr.sort.columns
    });
    this.grid.setReverse(appr.sort.reverse);

    if (appr.viewType == 'rows' && appr.colsOrder.length) {
      const allCols = new Set(this.allTableCols);
      const cols = appr.colsOrder.filter(c => allCols.has(c));
      if (cols.length)
        viewArgs.columns = cols;
    } else if (appr.viewType == 'cards' && appr.cardsView.columns.length) {
      viewArgs.columns = appr.cardsView.columns;
    }

    if (!isEquals(appr.filters, this.filterPanel.getFilters())) {
      this.filterPanel.setFilters(clone(appr.filters as FiltersMap));
    }

    this.updateViewId(viewArgs, force);
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

  isInProgress() {
    return this.updViewTask != null;
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

  private updateViewId(view: ViewArgs, force: boolean) {
    const updateSizes = () => {
      this.grid.resetAllColSize();
      const appr = this.appr.get();
      this.viewCols.forEach((c, i) => {
        const col = appr.columns[c];
        if (!col)
          return;
  
        if (col.width)
          this.grid.setColSize(i, col.width);
      });
    };

    if (!force && isEquals(view, this.viewArgs)) {
      updateSizes();
      return Promise.resolve();
    }

    if (this.updViewTask)
      this.updViewTask.cancel();

    this.viewArgs = view;
    this.updViewTask = (
      this.req.createView(view)
      .then(res => {
        this.updViewTask = undefined;
        if (this.viewId == res.viewId) {
          updateSizes();
          return null;
        }

        this.viewCols = res.desc.columns;

        this.viewId = res.viewId;
        console.log(res.viewId);

        this.grid.setRowsCount(res.desc.rows);
        this.grid.setColsCount(this.viewCols.length);
        updateSizes();

        this.grid.reloadCurrent();
        this.grid.delayedNotify({ type: 'resize' });
        this.delayedNotify();
        return null;
      })
    );

    return this.updViewTask;
  }
}

function updateFilterColumns(grid: GridViewModel) {
  const filter = grid.getFiltersPanel();
  const req = grid.getRequestor();

  const collectValues = async (column: string, args: GetValuesArgs, sort?: SortType): Promise<{ total: number; values: Array<Value> }> => {
    const viewArgs: ViewArgs = {
      distinct: { column }
    };

    if (sort == 'count')
      viewArgs.sorting = { cols: [{ name: 'count', asc: true }] };
    else if (sort == 'value')
      viewArgs.sorting = { cols: [{ name: 'value', asc: true }] };

    if (args.filters.length) {
      const colArr = column.split('.');
      const filter = await req.createView({
        viewId: colArr.length == 3 ? `${colArr[0]}.${colArr[1]}` : undefined,
        filter: convertFilters(args.filters)
      });
      viewArgs.viewId = filter.viewId;
    }

    const view = await req.createView(viewArgs);
    const res = await req.getRows({ viewId: view.viewId, from: args.from, count: args.count });

    return Promise.resolve({
      total: view.desc.rows,
      values: res.rows.map(row => {
        return {
          value: '' + row[0],
          count: +row[1]
        };
      })
    });
  };

  const makeColItem = (name: string): ColItem => {
    let sort: SortType | undefined;
    return {
      name,
      type: converType(grid.getColType(name)),
      getValues: (args: GetValuesArgs) => collectValues(name, args, sort),
      setSort: s => {
        sort = s;
        return Promise.resolve();
      },
      getNumRange: async (args: GetRangeArgs) => {
        const viewArgs: ViewArgs = {
          aggregate: { columns: [ name ] }
        };

        if (args.filters.length) {
          const f = await req.createView({ filter: convertFilters(args.filters) });
          viewArgs.viewId = f.viewId;
        }

        const view = await req.createView(viewArgs);
        const res = await req.getRows({ viewId: view.viewId, from: 0, count: 1 });
        const minIdx = view.desc.columns.findIndex(c => c == 'min');
        const maxIdx = view.desc.columns.findIndex(c => c == 'max');

        return {
          minMax: [
            res.rows[0][minIdx] as number,
            res.rows[0][maxIdx] as number
          ]
        };
      }
    };
  }

  filter.setColumns(grid.getAllColumnsForFilter().map(makeColItem));
  filter.subscribe(() => {
    grid.setFilters( convertFilters(filter.getFiltersArr('include')) );
  }, 'change-filter-values');
  filter.subscribe(() => {
    grid.setApprChange({ filters: { include: filter.getFilters().include } });
  }, 'change-filter-columns');
}

function converType(type: ColType): DBColType {
  if (type == 'string')
    return 'varchar';

  if (type == 'numeric')
    return 'real';

  return type;
}

function convertFilters(filters: Array<FilterHolder>): FilterArgs | undefined {
  const filter: FilterArgs = {
    children: [],
    op: 'and'
  };

  filters = filters.slice().sort((a, b) => a.order - b.order);
  const colsMap = new Map<string, Array<FilterHolder>>();
  filters.forEach(f => {
    let fHolders = colsMap.get(f.column.name);
    if (!fHolders)
      colsMap.set(f.column.name, fHolders = []);

    fHolders.push(f);
  });

  filters.forEach(f => {
    const cat = getCatFilter(f.filter);
    const range = getRangeFilter(f.filter);
    const text = getTextFilter(f.filter);
    if (cat) {
      if (cat.values.length == 1)
        filter.children.push({ column: f.column.name, value: cat.values[0] });
      else
        filter.children.push({ children: cat.values.map(value => ({ column: f.column.name, value })), op: 'or' });
    } else if (range) {
      filter.children.push({
        column: f.column.name,
        range: [
          range.range[0] ?? range.rangeFull[0],
          range.range[1] ?? range.rangeFull[1]
        ]
      });
    } else if (text) {
      filter.children.push({
        column: f.column.name,
        substr: text.filterText
      });
    }
  });

  if (!filter.children.length)
    return undefined;

  return filter;
}