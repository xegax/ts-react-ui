import { FontAppr, getFontApprDefault } from '../common/font-appr';
import { copyKeys } from '../common/common';

export interface GridColumnAppr {
  icon?: string;
  label?: string;
  font?: Partial<FontAppr>;
  width?: number;
}

export interface GridCardsViewAppr {
  width: number;
  height: number;
  border: boolean;
  padding: number;
  color: string;
  columns: Array<string>;
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
    columns: []
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
    viewType: 'rows'
  };

  if (override)
    copyKeys(defaults, override);

  return defaults;
}
