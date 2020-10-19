
export interface FilterValue {
  column: string;
  value: number | string;
}

export interface FilterRange {
  column: string;
  range: number[];
}

export interface FilterSubstr {
  column: string;
  substr: string;
}

export interface FilterCompound {
  children: Array<FilterArgs>;
  op: 'and' | 'or'
}

export type FilterArgs = FilterCompound | FilterValue | FilterSubstr | FilterRange;

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
}

export interface Aggregate {
  columns: string[];
}

export type AggFuncType = 'min' | 'max' | 'sum';

export interface ViewArgs {
  viewId?: string;

  filter?: FilterArgs;
  sorting?: {
    cols: Array<{ name: string; asc: boolean }>;
  };
  columns?: Array<string>;
  distinct?: Distinct;
  aggregate?: Aggregate;
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
