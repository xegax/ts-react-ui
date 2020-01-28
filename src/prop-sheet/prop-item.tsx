import * as React from 'react';
import { className as cn } from '../common/common';
import { css } from './classes';
import { KeyCode } from '../common/keycode';
import { DropDown, Props as DDProps } from '../drop-down';
import { Slider, Props as SliderBaseProps } from '../slider';
import { CSSIcon } from '../cssicon';
import { ListView, Item } from '../list-view2';
import { Popover, Classes } from '../popover';
import { render } from '../react-common'

export interface Props {
  label?: string;
  value?: any;
  show?: boolean;
  disabled?: boolean;
  fit?: boolean;
  wrapValue?: boolean;
  grow?: boolean;
  maxWidth?: string;

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
  while( parent && !hasClass(parent, css.group) ) {
    if (!value && parent && hasClass(parent, css.valueWrap))
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
    value = <div className={css.fit}>{value}</div>;

  const nc = cn(css.item, inline && css.inline, props.grow && css.grow);
  const vc = cn(css.value, props.wrapValue != false && css.valueWrap);

  return (
    <div
      className={nc}
      title={props.label}
      key={props.key}
    >
      {props.label && (
        <div className={css.nameWrap}>
          {props.label}
        </div>
      )}
      <div
        className={vc}
        style={{ maxWidth: props.maxWidth }}
        onMouseDown={scrollIntoView}
        title={typeof value == 'string' ? value : null}
      >
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
      <PropItem {...props} fit grow>
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
    <PropItem show={show} inline={inline} label={label} wrapValue={false} grow>
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
    <PropItem show={show} inline={inline} label={label} wrapValue={false} grow>
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
  const checkIcon = (
    <CSSIcon
      title={props.value ? 'On' : 'Off'}
      width='1em'
      align='left'
      displayFlex
      icon={`fa ${props.value ? 'fa-check-square-o' : 'fa-square-o'}`}
      onClick={() => props && props.onChanged(!props.value)}
    />
  );

  return (
    <PropItem
      show={show}
      inline={inline}
      label={label}
      wrapValue={false}
    >
      <div className='horz-panel-1'>
        {props.children}
        {checkIcon}
      </div>
    </PropItem>
  );
}


type DropDownProps2 = {
  value?: Item
  values: Array<Item>, onSelect?(v: Item): void
  renderSelect?(value: Item): JSX.Element;
} & Props;

type State = {
  valueArr: Array<Item>,
  value: Item
};

export class DropDownPropItem2 extends React.Component<DropDownProps2, State> {
  state = {
    valueArr: [],
    value: undefined
  };

  static getDerivedStateFromProps(p: DropDownProps2, s: State): Partial<State> | null {
    if (s.value != p.value) {
      return {
        valueArr: p.values.filter(v => v == p.value),
        value: p.value
      };
    }
    return null;
  }

  private renderSelect(item: Item): React.ReactChild {
    if (this.props.renderSelect)
      return this.props.renderSelect(item);

    return render(item.render, item) || item.value;
  }

  render() {
    const { show, inline, label } = this.props;
    const value: Item = this.state.valueArr[0];
    return (
      <PropItem show={show} inline={inline} label={label} wrapValue={false}>
        <Popover>
          <a>{!value ? 'Not selected' : this.renderSelect(value)}</a>
          <ListView
            value={this.state.valueArr}
            values={this.props.values}
            itemsPerPage={7}
            itemClassName={Classes.POPOVER_DISMISS}
            onSelect={items => this.props.onSelect(items[0])}
          />
        </Popover>
      </PropItem>
    );
  }
}
