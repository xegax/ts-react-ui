import * as React from 'react';
import { cn } from './common/common';

const classes = {
  cssicon: 'cssicon',
  showOnHover: 'show-on-hover',
  hidden: 'hidden',
  disabled: 'disabled',
  clickable: 'clickable'
};

export interface Props {
  icon: string;

  title?: string;
  hidden?: boolean;
  disabled?: boolean;
  showOnHover?: boolean;
  
  style?: React.CSSProperties;
  onClick?(e: React.MouseEvent): void;
}

export function CSSIcon(props: Props) {
  const className = cn(
    classes.cssicon,
    props.disabled && classes.disabled,
    props.showOnHover && classes.showOnHover,
    props.hidden && classes.hidden,
    props.onClick && classes.clickable
  );

  return (
    <span className={className} title={props.title}>
      <i style={props.style} className={props.icon}
        onClick={e => {
          if (props.disabled)
            return;

          props.onClick && props.onClick(e);
        }}
      />
    </span>
  );
}
