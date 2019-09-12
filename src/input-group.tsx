import * as React from 'react';
import * as BP from '@blueprintjs/core';
import { KeyCode } from './common/keycode';
import { cn } from './common/common';

interface Props {
  icon?: BP.IconName;
  placeholder?: string;
  right?: JSX.Element;
  onEnter?(text: string): void;
  value?: string;
  className?: string;
}

interface State {
  value?: string;
  propsValue?: string;
}

export class InputGroup extends React.Component<Props> {
  state: State = { value: '' };

  componentDidMount() {
    this.setState({
      value: this.props.value,
      propsValue: this.props.value
    });
  }

  static getDerivedStateFromProps(next: Props, state: State): State | undefined {
    if (next.value != state.propsValue)
      return { value: next.value, propsValue: next.value };
  }

  render() {
    return (
      <BP.InputGroup
        className={cn(BP.Classes.SMALL, this.props.className)}
        value={this.state.value}
        leftIcon={this.props.icon}
        rightElement={this.props.right}
        placeholder={this.props.placeholder}
        id='?'
        onChange={(evt: React.ChangeEvent<HTMLInputElement>) => {
          this.setState({ value: evt.target.value });
        }}
        onKeyDown={evt => {
          if (evt.keyCode == KeyCode.ENTER)
            this.props.onEnter && this.props.onEnter(this.state.value);
        }}
      />
    );
  }
}