export function isEquals<T>(obj1: T, obj2: T) {
  return JSON.stringify(obj1) == JSON.stringify(obj2);
}

export function clone<T = Object>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function className(...args: Array<string | boolean>): string {
  return args.filter(name => typeof name == 'string').map(name => name).join(' ');
}

export const cn = className;

export function clamp(value: number, minMax: Array<number>) {
  return Math.min(Math.max(value, minMax[0]), minMax[1]);
}

export function parsePath(path: string): {path: string, name: string} {
  let splitPos = path.lastIndexOf('/');
  if (splitPos != -1) {
    return {
      path: path.substr(0, splitPos + 1),
      name: path.substr(splitPos + 1)
    };
  }
  
  return {
    path: '',
    name: path
  };
}

export const enum Align {
  Left,
  Middle,
  Right
}

let touchDevice: boolean;
export function isTouchDevice() {
  if (touchDevice != null)
    return touchDevice;
  try {
    document.createEvent('TouchEvent');
    touchDevice = true;
  } catch (e) {
    touchDevice = false;
  }
}

export function join<T>(arr: Array<T>, separator: T): Array<T> {
  let res = [];
  arr.forEach((item, idx) => {
    if (idx != arr.length - 1)
      res.push(item, separator);
    else
      res.push(item);
  });
  return res;
}

export function copyKeys<T>(dst: T, src: T, isCopyAllowed?: (key: string) => boolean, path?: string) {
  path = path || '';

  Object.keys(src)
  .forEach(k => {
    const currPath = path ? path + '/' + k : k;
    if (isCopyAllowed && !isCopyAllowed(currPath))
      return;

    const srcVal = src[k];
    if (srcVal == null) {
      delete dst[k];
    } else if (Array.isArray(srcVal)) {
      dst[k] = clone(srcVal);
    } else if (typeof srcVal == 'object') {
      const dst2 = dst[k] || (dst[k] = {});
      copyKeys(dst2, srcVal, isCopyAllowed, currPath);
    } else {
      dst[k] = srcVal;
    }
  });
}

export function deepCopy<T>(src: Object, dst?: T): T {
  dst = dst || {} as T;
  for (let k in src) {
    const srcValue = src[k];
    // array, object
    if (srcValue !== null && typeof srcValue == 'object') {
      dst[k] = Array.isArray(srcValue) ? [] : {};
      deepCopy(srcValue, dst[k]);
    } else {
      dst[k] = srcValue;
    }
  }
  return dst;
}
