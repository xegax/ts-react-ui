import { FontAppr, getFontApprDefault } from '../common/font-appr';
import { copyKeys } from '../common/common';

export interface GridColumnAppr {
  label?: string;
  font: Partial<FontAppr>;
  width?: number;
}

export interface GridCardsViewAppr {
}

export interface GridSortAppr {
  columns: Array<{ name: string; asc: boolean }>;
  reverse: boolean;
}

export type GridViewType = 'grid' | 'cards';
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
  sort: GridSortAppr;
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
    viewType: 'grid'
  };

  if (override)
    copyKeys(defaults, override);

  return defaults;
}
