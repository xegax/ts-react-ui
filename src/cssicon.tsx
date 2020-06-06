import * as React from 'react';
import { cn } from './common/common';

const css = {
  cssicon: 'cssicon',
  showOnHover: 'show-on-hover',
  hidden: 'hidden',
  disabled: 'disabled',
  clickable: 'clickable',
  displayFlex: 'inline-flex',
  checked: 'checked',
  unchecked: 'unchecked'
};

export interface Props {
  icon: string;

  align?: 'left' | 'right';
  checked?: boolean;
  title?: string;
  hidden?: boolean;
  disabled?: boolean;
  showOnHover?: boolean;
  width?: string;
  displayFlex?: boolean;    // default: true

  style?: React.CSSProperties;
  onClick?(e: React.MouseEvent): void;
}

export function CSSIcon(props: Props) {
  const className = cn(
    css.cssicon,
    props.disabled && css.disabled,
    props.showOnHover && css.showOnHover,
    props.checked && css.checked,
    'checked' in props && !props.checked && css.unchecked,
    props.hidden && css.hidden,
    props.onClick && css.clickable,
    props.displayFlex !== false && css.displayFlex,
    props.align
  );

  return (
    <span
      className={className}
      title={props.title}
      style={{ width: props.width }}
      onClick={e => {
        if (props.disabled)
          return;

        props.onClick && props.onClick(e);
      }}
    >
      <i style={props.style} className={props.icon}/>
    </span>
  );
}
