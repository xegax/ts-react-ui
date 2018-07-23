import { Timer } from './timer';

/*export class ExtPromise<T = void> implements Promise<T> {
  private promise: Promise<T>;
  private parent: ExtPromise<T>;
  private cancelPromise: boolean = false;

  constructor( r: (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void,
               p?: ExtPromise<any>) {
    this.promise = new Promise(r);
    this.parent = p;
  }

  static resolve<T = any>(value: T | Promise<T>): ExtPromise<T> {
    return new ExtPromise<T>(resolve => resolve(value));
  }

  then<TResult>(
    onfulfilled?: (value: T) => TResult | PromiseLike<TResult>,
    onrejected?: (reason: any) => void | TResult | PromiseLike<TResult>
  ): Promise<TResult> {
    return new ExtPromise<TResult>((resolve, reject) => {
      this.promise.then(value => {
        if (this.cancelPromise)
          return;

        resolve(onfulfilled(value));
      });

      this.promise.catch(value => {
        if (this.cancelPromise)
          return;

        reject(onrejected(value));
      });
    }, this) as any as Promise<TResult>;
  }

  catch(onrejected?: (reason: any) => any): Promise<T> {
    return this.promise.catch(reason => {
      if (this.cancelPromise)
        return null;

      onrejected(reason);
    });
  }

  cancel(): void {
    if (this.cancelPromise)
      return;

    let p: ExtPromise<T> = this;
    while (p) {
      p.cancelPromise = true;
      p = p.parent;
    }
  }
}*/

export function timer(t: number): Promise<void> {
  return new Promise(resolve => {
    new Timer(resolve).run(t);
  });
}

export interface Cancelable {
  promise: Promise<any>;
  cancel: () => void;
}

export function cancelable(p: Promise<any>): Cancelable {
  let cancelPromise = false;
  const promise = new Promise((resolve, reject) => {
    p.then(data => {
      if (!cancelPromise)
        return resolve(data);
    });

    p.catch(err => {
      if (!cancelPromise)
        reject(err);
    });
  });

  return {
    cancel: () => cancelPromise = true,
    promise 
  };
}
