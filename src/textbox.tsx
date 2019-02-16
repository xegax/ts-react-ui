import * as React from 'react';
import { KeyCode } from '../common/keycode';

export interface Props {
  value?: string;
  disabled?: boolean;
  onEnter?(value: string): string | void;
  onCancel?(): void;
  autoFocus?: boolean;
  width?: number;
  className?: string;
  style?: React.CSSProperties;
}

interface State {
  value: string;
  propsValue: string;
}

export class Textbox extends React.PureComponent<Props, Partial<State>> {
  static defaultProps: Props = {
    className: 'textbox'
  };
  private ref = React.createRef<HTMLInputElement>();
  state: Readonly<Partial<State>> = {};

  constructor(props: Props) {
    super(props);

    this.state = {
      value: props.value,
      propsValue: props.value
    };
  }

  onEnter(value: string) {
    let newValue = this.props.onEnter && this.props.onEnter(value);
    if (typeof newValue == 'string' && this.props.value == null)
      this.setState({ value: newValue as string });
  }

  onCancel() {
    this.props.onCancel && this.props.onCancel();
    this.setState({ value: this.props.value });
  }

  static getDerivedStateFromProps(p: Props, s: State): State {
    if (p.value != s.propsValue)
      return { value: p.value == null ? '' : p.value, propsValue: p.value };
    return { value: s.value, propsValue: p.value };
  }

  render() {
    const { value, ...props } = this.props;
    return (
      <input
        className={this.props.className}
        style={{...this.props.style, width: this.props.width}}
        autoFocus={props.autoFocus}
        disabled={props.disabled}
        ref={this.ref}
        value={this.state.value}
        onBlur={e => {
          this.onEnter(e.currentTarget.value);
        }}
        onKeyDown={e => {
          const enter = e.keyCode == KeyCode.ENTER;
          const esc = e.keyCode == KeyCode.ESCAPE;
          if (!enter && !esc)
            return;

          if (enter) {
            this.onEnter(e.currentTarget.value);
          } else if (esc) {
            this.onCancel();
          }
        }}
        onChange={e => {
          this.setState({ value: e.currentTarget.value });
          // this.props.onChanged && this.props.onChanged(e.currentTarget.value);
        }}
      />
    );
  }
}
