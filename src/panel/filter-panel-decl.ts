import { DBColType } from '../common/db';
import { ElementType } from '../react-common';

export { DBColType };

export interface GetValuesArgs {
  from: number;
  count: number;
  filters: Array<FilterHolder>;
}

interface FilterArgs {
  filter: string;
  filters: Array<FilterHolder>;
}

export interface GetRangeArgs {
  filters: Array<FilterHolder>;
}

export interface Value {
  value: string;
  count?: number;
}

export type SortType = 'value' | 'count' | 'natural';
export interface ColItem {
  name: string;
  label?: ElementType;
  type: DBColType;

  getNumRange?(args: GetRangeArgs): Promise<{ minMax: Array<number> }>;
  getValues?(args: GetValuesArgs): Promise<{ total: number; values: Array<Value> }>;
  setSort?(type: SortType): Promise<void>;
  setFilter?(args: FilterArgs): Promise<{ total: number }>;
}

export interface FilterHolder {
  column: ColItem;
  filter: FilterData;
  order?: number;
}

export type CatFilter = {
  values: Array<string>;
  sort?: SortType;
  sortReverse?: boolean;
}

export type TextFilter = {
  filterText: string;
}

export type RangeFilter = {
  minMax?: Array<number>;
  range: Array<number>;
  rangeFull?: Array<number>;
}

export type FilterData = CatFilter | TextFilter | RangeFilter;

export interface FiltersMap {
  include: Array<{ column: string; data: Array<FilterData> }>;
  exclude: Array<{ column: string; data: Array<FilterData> }>;
}

export type FilterTgt = keyof FiltersMap;
export type FilterEventType = 'change-filter-columns' | 'change-filter-values';

export interface FilterModel {
  subscribe(callback: () => void, type?: FilterEventType): void;
  getFilters(): FiltersMap;
}

export function getCatFilter(f: FilterData): CatFilter | undefined {
  const cat = f as CatFilter;
  if (!cat || !cat.values)
    return undefined;
    
  return cat;
}

export function getRangeFilter(f: FilterData): RangeFilter | undefined {
  const range = f as RangeFilter;
  if (!range || !range.range)
    return undefined;
  return range;
}

export function getTextFilter(f: FilterData): TextFilter | undefined {
  const text = f as TextFilter;
  if (!text || text.filterText == null)
    return undefined;
  return text;
}
