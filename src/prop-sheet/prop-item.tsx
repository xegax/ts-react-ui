import * as React from 'react';
import { className as cn } from '../common/common';
import { classes } from './classes';
import { KeyCode } from '../common/keycode';
import { DropDown, Props as DDProps } from '../drop-down';
import { Slider, Props as SliderBaseProps } from '../slider';
import { Switch } from '@blueprintjs/core';

export interface Props {
  label?: string;
  value?: any;
  show?: boolean;
  disabled?: boolean;
  fit?: boolean;
  wrapValue?: boolean;

  inline?: boolean;

  width?: number;
  key?: string | number;
  children?: React.ReactChild | any;
}

function hasClass(e: Element, name: string) {
  return (e.className || '').split(' ').indexOf(name) != -1;
}

function scrollIntoView(e: React.MouseEvent) {
  let parent = e.currentTarget;
  let value: HTMLElement;
  while( parent && !hasClass(parent, classes.group) ) {
    if (!value && parent && hasClass(parent, classes.valueWrap))
      value = parent as HTMLElement;
    parent = parent.parentElement;
  }

  if (!parent)
    return;

  let wrap = parent.lastChild as HTMLElement;
  if (!value || wrap.scrollHeight == wrap.clientHeight)
    return;

  const offset = value.getBoundingClientRect().top - wrap.getBoundingClientRect().top;
  if (offset < 0)
    value.scrollIntoView(true);
  else if (offset + value.offsetHeight > wrap.clientHeight)
    value.scrollIntoView(false);
}

export const PropItem: React.SFC<Props> = (props: Props) => {
  const inline = props.inline != false;

  let value: JSX.Element = props.children || props.value;
  if (props.fit)
    value = <div className={classes.fit}>{value}</div>;

  const nc = cn(classes.item, inline && classes.inline);
  const vc = cn(classes.value, props.wrapValue != false && classes.valueWrap);
  return (
    <div
      className={nc}
      title={props.label}
      key={props.key}
    >
      <div className={classes.nameWrap}>
        {props.label}
      </div>
      <div className={vc} onMouseDown={scrollIntoView} title={typeof value == 'string' ? value : null}>
        {value}
      </div>
    </div>
  );
}

interface TextProps extends Props {
  onChanged?(value: string);
  onEnter?(value: string);
  onCancel?();
  autoFocus?: boolean;
}

interface State {
  key?: number;
}

export class TextPropItem extends React.PureComponent<TextProps, State> {
  ref = React.createRef<HTMLInputElement>();

  constructor(props: TextProps) {
    super(props);
    this.state = { key: 0 };
  }

  static getDerivedStateFromProps(newProps: Props, prevState: State) {
    return { key: prevState.key + 1 };
  }

  onChanged(value: string) {
    this.props.onEnter && this.props.onEnter(value);
    if (this.props.value == value)
      return;

    this.props.onChanged && this.props.onChanged(value);
  }

  onCancel() {
    this.props.onCancel && this.props.onCancel();
    this.setState({});
  }

  getSnapshotBeforeUpdate() {
    return {
      focus: document.activeElement == this.ref.current,
      value: this.ref.current.value
    };
  }

  componentDidUpdate(p, s, ss: { focus: boolean, value: string }) {
    if (ss.focus)
      this.ref.current.focus();

    this.ref.current.value = ss.value;
  }

  render() {
    const {value, ...props} = this.props;
    return (
      <PropItem {...props} fit>
        <input
          autoFocus={props.autoFocus}
          disabled={props.disabled}
          ref={this.ref}
          key={this.state.key}
          defaultValue={value}
          onBlur={e => {
            this.onChanged(e.currentTarget.value);
          }}
          onKeyDown={e => {
            const enter = e.keyCode == KeyCode.ENTER;
            const esc = e.keyCode == KeyCode.ESCAPE;
            if (!enter && !esc)
              return;

            if (enter) {
              this.onChanged(e.currentTarget.value);
            } else if (esc) {
              this.onCancel();
            }
          }}
        />
      </PropItem>
    );
  }
}

type DropDownProps = Props & DDProps & { left?: Array<JSX.Element>, right?: Array<JSX.Element> };
export const DropDownPropItem: React.SFC<DropDownProps> = (props: DropDownProps) => {
  const { show, inline, label } = props;
  return (
    <PropItem show={show} inline={inline} label={label} wrapValue={false}>
      <div style={{display: 'flex', flexGrow: 1, alignItems: 'center'}} className='horz-panel-1'>
        {props.left}
        <DropDown {...props}/>
        {props.right}
      </div>
    </PropItem>
  );
}

type SliderProps = Props & SliderBaseProps & { left?: Array<JSX.Element>, right?: Array<JSX.Element> };
export const SliderPropItem: React.SFC<SliderProps> = (props: SliderProps) => {
  const { show, inline, label } = props;
  return (
    <PropItem show={show} inline={inline} label={label} wrapValue={false}>
      <div style={{display: 'flex', flexGrow: 1, alignItems: 'center'}} className='horz-panel-1'>
        {props.left}
        <div style={{flexGrow: 1, display: 'flex'}}>
          <Slider {...props}/>
        </div>
        {props.right}
      </div>
    </PropItem>
  );
}

interface SwitchProps extends Props {
  onChanged?(value: boolean);
}

export const SwitchPropItem: React.SFC<SwitchProps> = (props: SwitchProps) => {
  const { show, inline, label } = props;
  return (
    <PropItem show={show} inline={inline} label={label} wrapValue={false}>
      <Switch
        disabled={props.disabled}
        checked={props.value}
        onChange={e => {
          props.onChanged && props.onChanged(e.currentTarget.checked);
        }}
      />
    </PropItem>
  );
}
