import { Publisher } from 'objio';
import { Box } from './box-layout-decl';
import { CSSRect, Rect } from '../common/rect';
import { Size } from '../common/point';

export class BoxLayoutEditorModel extends Publisher {
  private boxArr = new Array<Box>();
  private boxIdMap = new Map<string, Box>();
  private boxIdCounter = 0;
  private select = new Set<string>();
  private activeBoxKey?: string;

  private createBoxKey() {
    let newId = 'box-' + this.boxIdCounter;
    while (this.boxIdMap.has(newId))
      newId = 'box-' + (++this.boxIdCounter);

    return newId;
  }

  getBoxByKey(key: string): Box | undefined {
    return this.boxIdMap.get(key);
  }

  getActiveBoxKey() {
    return this.activeBoxKey;
  }

  createBox(box?: Box): Box {
    const key = this.createBoxKey();
    box = { ...box, key };
    this.boxIdMap.set(key, box);
    this.boxArr.push(box);

    this.delayedNotify();
    return box;
  }

  deleteByKeys(keys: Set<string>): boolean {
    let deleteNum = 0;
    this.boxArr = this.boxArr.filter(box => !keys.has(box.key));
    keys.forEach(key => {
      this.boxIdMap.delete(key);
      deleteNum++;
    });

    if (deleteNum) {
      this.delayedNotify();
      return true;
    }

    return false;
  }

  moveTo(dir: 'forward' | 'backward') {
    if (this.select.size == 0)
      return;

    const sel = this.boxArr.filter(box => this.select.has(box.key));
    this.boxArr = this.boxArr.filter(box => !this.select.has(box.key));
    if (dir == 'forward')
      this.boxArr.push(...sel);
    else
      this.boxArr.splice(0, 0, ...sel);
    this.delayedNotify();
  }

  selectBox(key: string) {
    if (this.select.has(key) && this.activeBoxKey == key)
      return;

    this.activeBoxKey = key;
    this.select.add(key);
    this.delayedNotify();
  }

  isSelect(key: string) {
    return this.select.has(key);
  }

  clearSelect() {
    if (!this.select.size)
      return;

    this.activeBoxKey = undefined;
    this.select.clear();
    this.delayedNotify();
  }

  getSelectedKeys() {
    return Array.from(this.select.keys());
  }

  getSelectNum() {
    return this.select.size;
  }

  getBoxArr() {
    return this.boxArr;
  }

  setBoxArr(arr: Array<Box>) {
    this.boxArr = arr;
    this.boxIdMap.clear();
    arr.forEach(box => {
      this.boxIdMap.set(box.key, box);
    });
  }
}

export function normalizeRect(rect: Partial<CSSRect & Size>, contSize: Size): Rect {
  const out: Rect = { x: 0, y: 0, width: rect.width, height: rect.height };
  if ('left' in rect && 'right' in rect) {
    out.x = rect.left;
    out.width = contSize.width - rect.right - rect.left;
  } else if ('left' in rect) {
    out.x = rect.left;
  } else if ('right' in rect) {
    out.x = contSize.width - rect.right - rect.width;
  }

  if ('top' in rect && 'bottom' in rect) {
    out.y = rect.top;
    out.height = contSize.height - rect.bottom - rect.top;
  } else if ('top' in rect) {
    out.y = rect.top;
  } else if ('bottom' in rect) {
    out.y = contSize.height - rect.bottom - rect.height;
  }

  return out;
}

export function getBoxRect(args: { box: Box, x?: 'left' | 'right' | 'stretch', y?: 'top' | 'bottom' | 'stretch', contSize: Size }): Partial<CSSRect & Size> {
  const rect = normalizeRect(args.box.rect, args.contSize);
  const newRect: Partial<CSSRect & Size> = {};
  const x = args.x || getBoxXAxis(args.box.rect);
  if (x == 'left') {
    newRect.left = rect.x;
    newRect.width = rect.width;
  } else if (x == 'right') {
    newRect.right = args.contSize.width - rect.x - rect.width;
    newRect.width = rect.width;
  } else if (x == 'stretch') {
    newRect.left = rect.x;
    newRect.right = args.contSize.width - rect.x - rect.width;
  }

  const y = args.y || getBoxYAxis(args.box.rect);
  if (y == 'top') {
    newRect.top = rect.y;
    newRect.height = rect.height;
  } else if (y == 'bottom') {
    newRect.bottom = args.contSize.height - rect.y - rect.height;
    newRect.height = rect.height;
  } else if (y == 'stretch') {
    newRect.top = rect.y;
    newRect.bottom = args.contSize.height - rect.y - rect.height;
  }

  return newRect;
}

export function getBoxXAxis(rect: Partial<CSSRect & Size>) {
  if ('left' in rect && 'right' in rect)
    return 'stretch';

  if ('left' in rect)
    return 'left';

  if ('right' in rect)
    return 'right';

  throw 'Something wrong';
}

export function getBoxYAxis(rect: Partial<CSSRect & Size>) {
  if ('top' in rect && 'bottom' in rect)
    return 'stretch';

  if ('top' in rect)
    return 'top';

  if ('bottom' in rect)
    return 'bottom';

  throw 'Something wrong';
}
