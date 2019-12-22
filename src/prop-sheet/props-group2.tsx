import * as React from 'react';
import { cn } from '../common/common';

const css = {
  propsGroup2: 'prop-group2',
  label: 'prop-group2-label',
  content: 'prop-group2-content',
  border: 'prop-group2-border',
  close: 'prop-group2-close'
};

interface Props {
  label: string;
  defaultOpen?: boolean;
  open?: boolean;
  children: React.ReactNode;
  border?: boolean;
}

interface State {
  open?: boolean;
}

function isOpen(p: Props): boolean {
  if ('open' in p)
    return p.open;

  if ('defaultOpen' in p)
    return p.defaultOpen;

  return true;
}

export class PropGroup2 extends React.Component<Props, State> {
  static defaultProps: Partial<Props> = {
    defaultOpen: true
  };

  state = { open: isOpen(this.props) };

  private onClick = () => {
    this.setState({ open: !this.state.open });
  };

  render() {
    return (
      <div
        className={cn(css.propsGroup2, this.props.border&& css.border, !this.state.open && css.close)}
      >
        <div
          className={cn(css.label)}
          onClick={this.onClick}
        >
          <i
            style={{ width: '1em' }}
            className={!this.state.open ? 'fa fa-angle-right' : 'fa fa-angle-down'}
          />
          {this.props.label}
        </div>
        {<div className={css.content}>
          {this.state.open && this.props.children}
        </div>}
      </div>
    );
  }
}
