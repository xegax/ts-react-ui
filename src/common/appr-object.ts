import { copyKeys, clone } from './common';

export class ApprObject<T extends Object> {
  private defaults: T;
  private changed: Partial<T>;

  private results?: T;  // defaults + changed

  constructor(defaults: T) {
    this.defaults = {...defaults};
    this.changed = {};
  }

  getChange() {
    return clone(this.changed);
  }

  set(obj: Partial<T>) {
    copyKeys(this.changed, obj);
    this.results = undefined;
  }

  // only to read
  get(): T {
    if (!this.results) {
      this.results = {} as T;
      copyKeys(this.results, this.defaults);
      copyKeys(this.results, this.changed);
    }

    return this.results;
  }

  isModified<
    K1 extends keyof T,
    K2 extends keyof T[K1],
    K3 extends keyof T[K1][K2],
    K4 extends keyof T[K1][K2][K3],
    K5 extends keyof T[K1][K2][K3][K4]
  >(k1?: K1, k2?: K2, k3?: K3, k4?: K4, k5?: K5): boolean {
    if (arguments.length == 0)
      return Object.keys(this.changed).length > 0;

    if (arguments.length > 5)
      throw 'Path length must be less 6';

    let p = this.changed;
    for (let n = 0; n < arguments.length; n++) {
      p = p[arguments[n]];
      if (p == null)
        return false;
    }

    return p != null;
  }

  resetToDefault<
    K1 extends keyof T,
    K2 extends keyof T[K1],
    K3 extends keyof T[K1][K2],
    K4 extends keyof T[K1][K2][K3],
    K5 extends keyof T[K1][K2][K3][K4]
  >(k1?: K1, k2?: K2, k3?: K3, k4?: K4, k5?: K5): boolean {
    if (arguments.length == 0) {
      this.changed = {};
      this.results = undefined;
      return true;
    }

    if (arguments.length > 5)
      throw 'Path length must be less 6';

    let p = this.changed;
    for (let n = 0; n < arguments.length; n++) {
      const key: string = arguments[n];
      if (n == arguments.length - 1) {
        delete p[key];
        return true;
      }

      p = p[key];
      if (p == null)
        return false;
    }
    return true;
  }
}
