import * as React from 'react';
import * as bp from '@blueprintjs/core';
import { Classes, Position } from '@blueprintjs/core';

export {
  Classes,
  Position
};

export interface Props extends bp.IPopoverProps {
  children: Array<React.ReactChild>;
}

export function Popover(props: Props) {
  const modif = {
    preventOverflow: { enabled: false },
    computeStyle: { gpuAcceleration: false },
    hide: { enabled: false },
    ...props.modifiers
  };

  const { modifiers, ...other } = props;

  return (
    <bp.Popover
      minimal
      usePortal
      modifiers={modif}
      position={bp.Position.BOTTOM_LEFT}
      {...other}
    >
      {props.children}
    </bp.Popover>
  );
}