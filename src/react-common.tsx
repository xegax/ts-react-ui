import * as React from 'react';

export type ElementType<T = any> = React.ReactChild | ((args?: T) => React.ReactChild);

export function render<T>(el: ElementType<T>, args?: T): React.ReactChild {
  if (typeof el == 'function')
    return args ? el(args) : el();
  return el;
}

export function FuncRenderer(p: { f: () => JSX.Element }): JSX.Element {
  return p.f();
}
