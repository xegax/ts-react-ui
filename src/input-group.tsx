import * as React from 'react';
import * as BP from '@blueprintjs/core';
import { KeyCode } from './common/keycode';
import { cn } from './common/common';

interface Props {
  icon?: BP.IconName;
  placeholder?: string;
  right?: JSX.Element;
  onEnter?(text: string): void;
  defaultValue?: string;
  className?: string;
}

interface State {
  value?: string;
}

export class InputGroup extends React.Component<Props> {
  state: State = { value: '' };

  componentDidMount() {
    this.setState({ value: this.props.defaultValue });
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