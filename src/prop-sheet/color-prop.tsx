import * as React from 'react';
import { PropItem } from './prop-item';
import { Button } from '../blueprint';
import { getColor } from '../color';

interface Props {
  color: string;
  label?: string;
  onChange?(color: string): void;
}

export const ColorProp: React.SFC<Props> = props => {
  return (
    <PropItem
      label={props.label || 'Color'}
    >
      <Button
        small
        style={{ backgroundColor: props.color, width: '1em' }}
        onClick={() => {
          getColor({
            color: props.color,
            onChanging: props.onChange
          })
          .then(props.onChange)
          .catch(() => props.onChange?.(props.color));
        }}
      />
    </PropItem>
  );
}
