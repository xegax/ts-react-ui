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
  children?: React.ReactChild;
}

export const PropSheetImpl: React.SFC<Props> = (props: Props) => {
  return (
    <div className={classes.propSheet}>
      {!props.disabled ? props.children : React.Children.map(props.children, child => {
        return React.cloneElement(child as any, { disabled: true });
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
