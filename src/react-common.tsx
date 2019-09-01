import * as React from 'react';

export type ElementType<T = any> = React.ReactNode | ((args?: T) => React.ReactNode);

export function render<T>(el: ElementType<T>, args?: T): React.ReactNode {
  if (typeof el == 'function')
    return args ? el(args) : el();
  return el;
}
