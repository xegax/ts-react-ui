import * as React from 'react';
import * as bp from '@blueprintjs/core';
import { Classes, Position } from '@blueprintjs/core';
import { CSSIcon, Props as FontIconProps } from './cssicon';

export {
  Classes,
  Position
};

export interface Props extends bp.IPopoverProps {
  children: Array<React.ReactChild>;  // children[0] target, children[1] list
}

export function Popover(props: Props): JSX.Element {
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

export interface IconProps extends FontIconProps {
  children: React.ReactChild;
  position?: bp.Position;
}

let open: PopoverIcon = null;
export class PopoverIcon extends React.Component<IconProps> {
  render() {
    return (
      <Popover
        position={this.props.position}
        popoverWillOpen={() => {
          open = this;
          this.setState({});
        }}
        popoverDidClose={() => {
          if (open == this)
            open = null;

          this.setState({});
        }}
      >
        <CSSIcon
          onClick={() => {}}
          {...this.props}
          style={{
            borderRadius: 2,
            color: open == this ? 'white' : undefined,
            backgroundColor: open == this ? 'black' : undefined,
            display: 'inline-flex',
            width: '1.2em',
            height: '1.2em',
            alignItems: 'center',
            justifyContent: 'center',
            ...this.props.style
          }}
        />
        {this.props.children}
      </Popover>
    );
  }
}
