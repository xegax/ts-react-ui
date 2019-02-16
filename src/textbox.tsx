import * as React from 'react';
import { KeyCode } from '../common/keycode';

export interface Props {
  resizeable?: boolean;
  value?: string;
  disabled?: boolean;
  onEnter?(value: string): string | void;
  onCancel?(): void;
  autoFocus?: boolean;
  width?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

interface State {
  value: string;
  propsValue: string;
  width?: number;
  height?: number;
}

export class Textbox extends React.PureComponent<Props, Partial<State>> {
  static defaultProps: Props = {
    className: 'textbox'
  };
  private text = React.createRef<HTMLDivElement>();
  private ref = React.createRef<HTMLInputElement>();
  state: Readonly<Partial<State>> = {};

  constructor(props: Props) {
    super(props);

    this.state = {
      value: props.value,
      propsValue: props.value
    };
  }

  componentDidMount() {
    const text = this.text.current;
    if (this.props.resizeable) {
      this.setState({ width: text.offsetWidth, height: text.offsetHeight });
    }
  }

  componentDidUpdate() {
    const text = this.text.current;
    if (this.props.resizeable && text.offsetWidth != this.state.width || text.offsetHeight != this.state.height) {
      this.setState({ width: text.offsetWidth, height: text.offsetHeight });
    }
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
    let width = this.props.width || 0;
    let height = null;
    if (this.state.width != null || this.state.height != null) {
      width = this.state.width || '0.5em';
      height = this.state.height || '1em';
    }

    return (
      <div style={{display: 'inline-block', position: 'relative'}}>
        {this.props.resizeable &&
          <div
            ref={this.text}
            style={{
              ...this.props.style,
              display: 'inline-block',
              visibility: 'hidden',
              position: 'absolute'
            }}
          >
            {this.state.value}
          </div>
        }
        <input
          className={this.props.className}
          style={{...this.props.style, width, height}}
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
            if (this.text.current)
              this.text.current.innerHTML = e.currentTarget.value;
            this.setState({ value: e.currentTarget.value });
          }}
        />
      </div>
    );
  }
}
