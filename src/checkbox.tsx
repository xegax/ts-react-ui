import * as React from 'react';
import { cn } from './common/common';

export interface Props {
  disabled?: boolean;
  value: boolean;
  title?: string;
  onChange?(newValue: boolean);
  style?: React.CSSProperties;
}

export function CheckBox(props: Props) {
  const s = props.value ? 'fa fa-check-square-o' : 'fa fa-square-o';
  return (
    <span className={cn('checkbox', props.disabled && 'disabled')} title={props.title}>
      <i
        className={s}
        style={props.style}
        onClick={() => {
          if (props.disabled)
            return;

          props.onChange && props.onChange(!props.value);
        }}
      />
    </span>
  );
}
