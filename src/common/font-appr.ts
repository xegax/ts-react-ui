import type { CSSProperties } from 'react';

export type HorzAlign = 'left' | 'center' | 'right';
export interface FontAppr {
  family: string;
  sizePx: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  color: string;
  align: HorzAlign;
};

export function getStyleFromAppr(appr: Partial<FontAppr>): CSSProperties {
  return {
    fontFamily: appr.family,
    fontSize: appr.sizePx,
    color: appr.color,
    fontWeight: appr.bold ? 'bold' : undefined,
    textAlign: appr.align,
    textDecoration: appr.underline ? 'underline' : undefined,
    fontStyle: appr.italic ? 'italic' : undefined
  };
}

export function getFontApprDefault(override?: Partial<FontAppr>): FontAppr {
  const defaults: FontAppr = {
    family: 'Segoe UI',
    sizePx: 14,
    bold: false,
    italic: false,
    underline: false,
    color: '#000000',
    align: 'left'
  };

  return {
    ...defaults,
    ...override
  };
}
