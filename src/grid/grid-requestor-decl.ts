export interface FilterValue {
  column: string;
  value: number | string;
};

export interface FilterCompound {
  children: Array<FilterValue | FilterCompound>;
  op: 'and' | 'or'
};

export type FilterArgs = FilterCompound;

export type InfoAttrs = 'rows' | 'columns' | 'types';

export interface ViewDesc {
  columns?: Array<string>;
  rows?: number;
  types?: Array<string>;
}

export interface RowsArgs {
  viewId: string;
  from: number;
  count: number;
}

export type CellValue = string | number;
export type RecCell = Record<string, CellValue>;
export type ArrCell = Array<CellValue>;
export type Cell = RecCell | ArrCell;

export interface RowsResult<TCell extends Cell> {
  rows: Array<TCell>;
}

export interface WrapperArgs<Type extends string, TArgs extends any> {
  type: Type;
  args: TArgs;
}

export interface Distinct {
  column: string;
};

export interface ViewArgs {
  viewId?: string;

  filter?: FilterArgs;
  sorting?: {
    cols: Array<{ name: string; asc: boolean }>;
  };
  columns?: Array<string>;
  distinct?: Distinct;
  descAttrs?: Array<InfoAttrs>;
}

export interface ViewResult {
  viewId: string;
  desc: ViewDesc;
}

export interface GridRequestor<TCell extends Cell> {
  createView(args: ViewArgs): Promise<ViewResult>;
  getRows(args: RowsArgs): Promise<RowsResult<TCell>>;
  clearCache(): void;
}
