import * as React from 'react';
import { KeyCode } from './common/keycode';

export interface Props {
  placeholder?: string;
  resizeable?: boolean;
  value?: string;
  disabled?: boolean;
  onEnter?(value: string): string | void;
  onCancel?(): void;
  autoFocus?: boolean;
  width?: number | string;
  className?: string;
  style?: React.CSSProperties;
  fitToFlex?: boolean;
}

interface State {
  value?: string;
  propsValue?: string;
  width?: number;
  height?: number;
}

export class Textbox extends React.PureComponent<Props, Partial<State>> {
  static defaultProps: Props = {
    className: 'textbox'
  };
  private text = React.createRef<HTMLDivElement>();
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
    if (!text)
      return;

    if (this.props.resizeable && text.offsetWidth != this.state.width || text.offsetHeight != this.state.height) {
      this.setState({ width: text.offsetWidth, height: text.offsetHeight });
    }
  }

  onEnter(value: string) {
    let newValue = this.props.onEnter && this.props.onEnter(value);
    if (typeof newValue == 'string' && this.props.value == null)
      this.setState({ value: newValue as string });
    else
      this.setState({ propsValue: null });
  }

  onCancel() {
    this.props.onCancel && this.props.onCancel();
    this.setState({ value: this.props.value });
  }

  static getDerivedStateFromProps(newp: Props, s: State): State {
    let news: State = { propsValue: newp.value };

    if (newp.value != s.propsValue) {
      news.value = newp.value == null ? '' : newp.value;
    }

    return news;
  }

  render() {
    const { value, fitToFlex, ...props } = this.props;
    let width = this.props.width || 0;
    let height = null;
    if (this.state.width != null || this.state.height != null) {
      width = this.state.width || '0.5em';
      height = this.state.height || '1em';
    }

    const { fontSize, ...style } = this.props.style || {} as React.CSSProperties;

    return (
      <div
        style={{
          display: fitToFlex ? 'flex' : 'inline-block',
          flexGrow: fitToFlex ? 1 : undefined,
          position: 'relative',
          fontSize
        }}
      >
        {this.props.resizeable &&
          <div
            ref={this.text}
            style={{
              ...style,
              display: 'inline-block',
              visibility: 'hidden',
              position: 'absolute'
            }}
          >
            {this.state.value}
          </div>
        }
        <input
          placeholder={this.props.placeholder}
          className={this.props.className}
          style={{...style, width, height}}
          autoFocus={props.autoFocus}
          disabled={props.disabled}
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
