import { Point } from './point';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CSSRect {
  left: number;
  top: number;
  bottom: number;
  right: number;
}

export function toCSSRect(rect: Rect): CSSRect {
  return {
    left: rect.x,
    top: rect.y,
    right: rect.x + rect.width,
    bottom: rect.y + rect.height
  };
}

export function fromCSSRect(rect: CSSRect): Rect {
  return {
    x: rect.left,
    y: rect.top,
    width: rect.right - rect.left,
    height: rect.bottom - rect.top
  };
}

export function isRectsEqual(r1: Rect, r2: Rect) {
  return (
    r1.x == r2.x &&
    r1.y == r2.y &&
    r1.width == r2.width &&
    r1.height == r2.height
  );
}

export function isPointInRect(pt: Point, rect: Rect) {
  return pt.x >= rect.x && pt.y >= rect.y && pt.x <= rect.x + rect.width && pt.y <= rect.y + rect.height;
}

export function normalizeRectSize(rect: Rect) {
  if (rect.width < 0) {
    rect.x += rect.width;
    rect.width = -rect.width;
  }

  if (rect.height < 0) {
    rect.y += rect.height;
    rect.height = -rect.height;
  }

  return rect;
}

export function checkRectsIntersection(r1: Rect, r2: Rect) {
  if (r1.width < 0 || r1.height < 0)
    r1 = normalizeRectSize({...r1});

  if (r2.width < 0 || r2.height < 0)
    r2 = normalizeRectSize({...r2});
  return !(r2.x >= r1.x + r1.width || r2.x + r2.width <= r1.x || r2.y >= r1.y + r1.height || r2.y + r2.height <= r1.y);
}
