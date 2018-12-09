import * as React from 'react';
import { FitToParent } from '../fittoparent';
import { classes } from './classes';
export { PropsGroup } from './props-group';
export {
  PropItem,
  TextPropItem,
  DropDownPropItem,
  SliderPropItem,
  SwitchPropItem
} from './prop-item';

export interface Props {
  width?: number;
  disabled?: boolean;
  children?: React.ReactChild | Array<React.ReactChild>;
}

export const PropSheetImpl: React.SFC<Props> = (props: Props) => {
  return (
    <div className={classes.propSheet}>
      {React.Children.map(props.children, child => {
        if (!child)
          return null;

        return (
          React.cloneElement(child as any, {
            disabled: props.disabled,
            width: props.width - 2
          })
        );
      })}
    </div>
  );
}

export const PropSheet: React.SFC<Props> = (props: Props) => {
  return (
    <FitToParent calcH = {false}>
      <PropSheetImpl {...props}/>
    </FitToParent>
  );
}
