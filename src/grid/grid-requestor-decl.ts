interface FilterArgs {
}

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

export type Distinct = WrapperArgs<'distinct', {
  column: string;
}>;

export interface ViewArgs<T extends WrapperArgs<string, any>> {
  viewId?: string;

  filter?: FilterArgs;
  sorting?: {
    cols: Array<{ name: string; asc: boolean }>;
  };
  columns?: Array<string>;
  wrapper?: T;  // distinct, ...
  descAttrs?: Array<InfoAttrs>;
}
export type ViewArgsT = ViewArgs<WrapperArgs<string, any>>;

export interface ViewResult {
  viewId: string;
  desc: ViewDesc;
}

export interface GridRequestor<TWrapper extends WrapperArgs<string, any>, TCell extends Cell> {
  createView(args: ViewArgs<TWrapper>): Promise<ViewResult>;
  getRows(args: RowsArgs): Promise<RowsResult<TCell>>;
  clearCache(): void;
}
