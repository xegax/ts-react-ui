import { Point } from './point';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function isPointInRect(pt: Point, rect: Rect) {
  return pt.x >= rect.x && pt.y >= rect.y && pt.x <= rect.x + rect.width && pt.y <= rect.y + rect.height;
}
