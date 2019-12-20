import * as React from 'react';
import { css } from './classes';
export { PropsGroup } from './props-group';
export {
  PropItem,
  TextPropItem,
  DropDownPropItem,
  DropDownPropItem2,
  SliderPropItem,
  SwitchPropItem
} from './prop-item';
import { VerticalResizer } from '../resizer';
import { cn } from '../common/common';

export interface Props {
  defaultWidth?: number;
  disabled?: boolean;
  children?: React.ReactChild | Array<React.ReactChild>;
  fitToAbs?: boolean;
  resize?: boolean;
}

interface State {
  width?: number;
}

export class PropSheet extends React.Component<Props, State> {
  state: State = {};
  ref = React.createRef<HTMLDivElement>();

  render() {
    const width = this.state.width == null ? this.props.defaultWidth : this.state.width;

    return (
      <div ref={this.ref} style={{ width }} className={cn(css.propSheetWrap, this.props.fitToAbs && css.fitToAbs)}>
        <div className={css.propSheet}>
          {React.Children.map(this.props.children, child => {
            if (!child)
              return null;

            return (
              React.cloneElement(child as any, {
                disabled: this.props.disabled,
                width: width - 2
              })
            );
          })}
        </div>
        {this.props.resize && <VerticalResizer
          size={width}
          onResizing={width => {
            this.setState({ width });
          }}
          onDoubleClick={() => {
            this.setState({ width: this.props.defaultWidth });
          }}
        />}
      </div>
    );
  }
}
