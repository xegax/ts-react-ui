import { FontAppr, getFontApprDefault } from '../common/font-appr';
import { copyKeys } from '../common/common';
import { FiltersMap } from '../panel/filter-panel-decl';
import { Box } from '../box-layout/box-layout-decl';

export interface GridColumnAppr {
  icon?: string;
  label?: string;
  font?: Partial<FontAppr>;
  width?: number;
}

export type ValueType = 'custom' | 'table' | 'none';
export interface ContentValue {
  type: ValueType;
  custom: string;
  value: string;
}

export type BoxContentType = 'text' | 'image' | 'auto';
export type Overflow = 'auto' | 'clip' | 'hidden' | 'scroll' | 'visible';
export interface BoxAppr {
  content: Partial<ContentValue>;
  href: Partial<ContentValue>;
  tooltip: Partial<ContentValue>;
  
  font: Partial<FontAppr>;
  border: boolean;
  background: string;
  contentType: BoxContentType;
  overflow: Overflow;
  padding: number;
}

export interface GridCardsViewAppr {
  width: number;
  height: number;
  border: boolean;
  padding: number;
  color: string;
  columns: Array<string>;
  boxArr: Array<Box>;
  boxAppr: Partial<BoxAppr>;
  boxMap: {[key: string]: Partial<BoxAppr>};
}

export interface GridSortAppr {
  columns: Array<{ name: string; asc: boolean }>;
  reverse: boolean;
}

export interface GridSortSchema {
  name: string;
  schema: GridSortAppr;
}

export type GridViewType = 'rows' | 'cards';
export interface GridHeaderAppr {
  show: boolean;
  font: Partial<FontAppr>;
  border: boolean;
  padding: number;
}

export interface GridBodyAppr {
  font: Partial<FontAppr>;
  padding: number;
  border: boolean;
  rowColors: string[];
}

export interface GridViewAppr {
  header: Partial<GridHeaderAppr>;
  body: Partial<GridBodyAppr>;
  columns: {[column: string]: Partial<GridColumnAppr>};
  colsOrder: Array<string>;
  cardsView: Partial<GridCardsViewAppr>;
  sort: Partial<GridSortAppr>;
  sortSchema: Array<GridSortSchema>;
  viewType: GridViewType;
  filters: Partial<FiltersMap>;
};

export function getGridViewApprDefault(override?: Partial<GridViewAppr>) {
  const header: GridHeaderAppr = {
    show: true,
    border: false,
    padding: 8,
    font: getFontApprDefault({ sizePx: 16 })
  };

  const body: GridBodyAppr = {
    font: getFontApprDefault({ sizePx: 14, color: '#404040' }),
    padding: 5,
    border: true,
    rowColors: []
  };

  const cardsView: GridCardsViewAppr = {
    width: 200,
    height: 250,
    border: true,
    padding: 5,
    color: '#ffffff',
    columns: [],
    boxArr: [],
    boxAppr: {
      overflow: 'visible',
      font: getFontApprDefault({ sizePx: 10, color: '#101010' })
    },
    boxMap: {}
  };

  const sort: GridSortAppr = {
    columns: [],
    reverse: false
  };

  const defaults: GridViewAppr = {
    header,
    body,
    columns: {},
    colsOrder: [],
    cardsView,
    sort,
    sortSchema: [],
    filters: {
      include: [],
      exclude: []
    },
    viewType: 'rows'
  };

  if (override)
    copyKeys(defaults, override);

  return defaults;
}
