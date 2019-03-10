import * as React from 'react';
import { className as cn } from './common/common';

const classes = {
  checkicon: 'checkicon',
  checked: 'checked',
  hidden: 'hidden',
  showOnHover: 'show-on-hover'
};

export interface Props {
  style?: React.CSSProperties;
  hidden?: boolean;
  disabled?: boolean;
  showOnHover?: boolean;
  faIcon: string;
  value: boolean;
  title?: string;
  onChange?(newValue: boolean): void;
  onClick?(e: React.MouseEvent): void;
}

export function CheckIcon(props: Props) {
  const className = cn(
    classes.checkicon,
    props.value && classes.checked,
    props.disabled && 'disabled',
    props.showOnHover && classes.showOnHover,
    props.hidden && classes.hidden
  );

  return (
    <span className={className} title={props.title}>
      <i style={props.style} className={props.faIcon} onClick={e => {
        if (props.disabled)
          return;

        props.onChange && props.onChange(!props.value);
        props.onClick && props.onClick(e);
      }}/>
    </span>
  );
}
