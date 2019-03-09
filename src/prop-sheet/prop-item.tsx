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
  onChanged?(value: string): string | void;
  onEnter?(value: string): string | void;
  onCancel?();
  autoFocus?: boolean;
}

interface TextState {
  value: string;
  propsValue: string;
}

export class TextPropItem extends React.PureComponent<TextProps, Partial<TextState>> {
  ref = React.createRef<HTMLInputElement>();
  state: Readonly<Partial<TextState>> = {};

  constructor(props: TextProps) {
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

  static getDerivedStateFromProps(p: TextProps, s: TextState): TextState {
    if (p.value != s.propsValue)
      return { value: p.value == null ? '' : p.value, propsValue: p.value };
    return { value: s.value, propsValue: p.value };
  }

  render() {
    const {value, ...props} = this.props;
    return (
      <PropItem {...props} fit>
        <input
          tabIndex={0}
          autoFocus={props.autoFocus}
          disabled={props.disabled}
          ref={this.ref}
          value={this.state.value}
          onClick={e => {
            e.stopPropagation();
          }}
          onBlur={e => {
            this.onEnter(e.currentTarget.value);
          }}
          onKeyDown={e => {
            e.stopPropagation();
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
            this.props.onChanged && this.props.onChanged(e.currentTarget.value);
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
