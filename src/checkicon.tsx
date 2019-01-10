import * as React from 'react';
import { className as cn } from './common/common';

const classes = {
  checkicon: 'checkicon',
  checked: 'checked',
  showOnHover: 'show-on-hover'
};

export interface Props {
  disabled?: boolean;
  showOnHover?: boolean;
  faIcon: string;
  value: boolean;
  title?: string;
  onChange?(newValue: boolean);
}

export function CheckIcon(props: Props) {
  const className = cn(
    classes.checkicon,
    props.value && classes.checked,
    props.disabled && 'disabled',
    props.showOnHover && classes.showOnHover
  );

  return (
    <span className={className} title={props.title}>
      <i className={props.faIcon} onClick={() => {
        if (props.disabled)
          return;

        props.onChange && props.onChange(!props.value);
      }}/>
    </span>
  );
}
