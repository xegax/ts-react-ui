import * as React from 'react';
import { className as cn } from './common/common';

const classes = {
  checkicon: 'checkicon',
  checked: 'checked'
};

export interface Props {
  disabled?: boolean;
  faIcon: string;
  value: boolean;
  title?: string;
  onChange?(newValue: boolean);
}

export function CheckIcon(props: Props) {
  return (
    <span className={cn(classes.checkicon, props.value && classes.checked, props.disabled && 'disabled')} title={props.title}>
      <i className={props.faIcon} onClick={() => {
        if (props.disabled)
          return;

        props.onChange && props.onChange(!props.value);
      }}/>
    </span>
  );
}
