import { cpChild } from './cp-child-worker';

export interface CalcWatch {
  progress?(): number;
}

export interface CalcHandler {
  calc?(arr: Array<number>, agg: 'summ' | 'min' | 'max' | 'avg'): Promise<number>;
  test?(): void;
}

cpChild<CalcWatch, CalcHandler>({
  test: () => {
    console.log(document);
  },
  calc: (arr, agg) => {
    console.log('calc started');
    
    let t = Date.now();
    let v = undefined;
    for (let i = 0; i < 100; i++) {
      for (let p = 0; p < 99999; p++)
      for (let n = 0; n < arr.length; n++) {
        if (v == null) {
          v = arr[n];
        } else {
          const next = arr[n];
          if (agg == 'min')
            v = Math.min(v, next);
          else if (agg == 'max')
            v = Math.max(v, next);
          else if (agg == 'summ' || agg == 'avg')
            v += next;
        }
      }
    }

    console.log('time', (Date.now() - t) / 1000);
    if (agg == 'avg')
      return Promise.resolve(v / arr.length);

    return Promise.resolve(v);
  }
});
