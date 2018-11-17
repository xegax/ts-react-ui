import * as React from 'react';
import { className as cn, clamp } from './common/common';
import { KeyCode } from './common/keycode';
import { Publisher } from 'objio/common/publisher';

const classes = {
  class: 'list-view-ctrl',
  item: 'list-item',
  select: 'select',
  border: 'border',
  focus: 'focus'
};

interface Item {
  value: string;
  render?: string | JSX.Element | ((item: Item, jsx: JSX.Element) => JSX.Element);
}

interface Props {
  values: Array<Item>;
  value?: string;
  defaultValue?: string;
  border?: boolean;
  style?: React.CSSProperties;
  dummy?: number;

  itemsPerPage?: number;
  width?: number;
  model?: ListViewModel;

  onSelect?(item: Item);
  onItemSize?(size: number);
  noDataToDisplay?: JSX.Element;
}

interface State {
  itemSize?: number;
  model?: ListViewModel;
}

class ListViewModel extends Publisher {
  private values = Array<Item>();
  private focus: number;
  private select: Item;

  getFocus(): number {
    return this.focus;
  }

  setFocus(focus: number): boolean {
    if (this.focus == focus)
      return false;

    this.focus = focus;
    this.delayedNotify({});
    return true;
  }

  setValues(values: Array<Item>) {
    if (this.values == values)
      return false;

    this.values = values;
    this.focus = null;
    this.delayedNotify({ type: 'values' });
    return true;
  }

  getValues() {
    return this.values;
  }

  setValue(value: string, notify?: boolean) {
    if (this.select && value == this.select.value)
      return;

    const idx = this.values.findIndex(item => item.value == value);
    if (idx != -1) {
      this.select = this.values[idx];
      this.focus = idx;
    }

    if (notify == false)
      return;

    this.delayedNotify({ type: 'select' });
  }

  selectItem(idx: number, notify?: boolean): boolean {
    if (!this.values[idx])
      return false;

    const select = this.values[idx];
    if (select == this.select)
      return false;

    this.select = select;
    this.focus = idx;

    if (notify == false)
      return false;

    this.delayedNotify({ type: 'select' });
    return true;
  }

  getValue(): string {
    if (this.select)
      return this.select.value;

    return null;
  }

  getSelect(): Item {
    return this.select;
  }
}

export class ListView extends React.Component<Props, State> {
  state: Readonly<Partial<State>> = {};
  ref = React.createRef<HTMLDivElement>();

  constructor(props: Props) {
    super(props);

    const model = props.model || new ListViewModel();
    model.subscribe(() => {
      if (this.ref && this.ref.current)
        this.ref.current.scrollTop = 0;
    }, 'values');

    model.setValues(props.values);
    this.state = { model };
  }

  static getDerivedStateFromProps(props: Props, state: State) {
    state.model.setValues(props.values);

    if (!state.model.getValue() && props.defaultValue)
      state.model.setValue(props.defaultValue);
    else if (props.value != null)
      state.model.setValue(props.value);

    return null;
  }

  subscriber = () => {
    this.setState({});
  }

  componentDidMount() {
    this.updateFirstItemSize();

    this.state.model.subscribe(this.subscriber);
  }

  componentWillUnmount() {
    this.state.model.unsubscribe(this.subscriber);
  }

  getLabel(item: Item): string {
    if (typeof item.render == 'string')
      return item.render;
    return item.value;
  }

  renderItem(item: Item, idx: number, select: boolean) {
    let jsx: JSX.Element | string;
    if (typeof item.render != 'function')
      jsx = item.render || item.value;
    else
      jsx = item.render(item, <>{item.value}</>);

    return (
      <div
        key={idx}
        title={this.getLabel(item)}
        className={cn(classes.item, select && classes.select, idx == this.state.model.getFocus() && classes.focus)}
        onClick={e => {
          this.state.model.setValue(item.value);
          this.state.model.notify();

          this.props.onSelect && this.props.onSelect(item);
        }}
      >
        {jsx}
      </div>
    );
  }

  scrollToFocus() {
    let focus = this.state.model.getFocus();

    const ctrl = this.ref.current;
    const el = ctrl.childNodes.item(focus) as HTMLElement;
    const first = ctrl.firstChild as HTMLElement;
    if (!el)
      return;

    const firstPos = first.getBoundingClientRect();
    const elPos = el.getBoundingClientRect();
    const bbox = ctrl.getBoundingClientRect();

    const offsetTop = elPos.top - bbox.top;
    const pos = Math.round(elPos.top - firstPos.top);
    if (offsetTop < 0) {
      ctrl.scrollTop = pos;
    } else if (offsetTop + el.offsetHeight >= bbox.height) {
      ctrl.scrollTop = Math.round(pos + el.offsetHeight - bbox.height + 2);
    }
  }

  getMaxHeight(): number {
    if (this.state.itemSize && this.props.itemsPerPage)
      return this.props.itemsPerPage * this.state.itemSize;

    return null;
  }

  updateFirstItemSize() {
    let itemSize = 0;
    if (!this.ref.current || !this.ref.current.children)
      return;

    const list = this.ref.current;

    itemSize = (list.childNodes.item(0) as HTMLElement).getBoundingClientRect().height;
    if (itemSize == 0)
      return setTimeout(() => this.updateFirstItemSize(), 5);

    if (itemSize == this.state.itemSize)
      return;

    if ( this.props.onItemSize && !this.state.itemSize )
      this.props.onItemSize(itemSize);

    this.setState({ itemSize });
    this.updateSelection( itemSize );
  }

  updateSelection(itemSize?: number) {
    itemSize = itemSize || this.state.itemSize;
    if (!itemSize)
      return false;

    const value = this.state.model.getValue();
    if (!value)
      return false;

    const idx = this.props.values.findIndex(item => {
      return item.value == value;
    });

    if (idx == -1)
      return false;
    
    this.ref.current.scrollTop = idx * this.state.itemSize;
    return true;
  }

  onKeyDown = (e: React.KeyboardEvent) => {
    let focus = this.state.model.getFocus();
    if (e.keyCode == KeyCode.ENTER && this.state.model.selectItem(focus)) {
      return this.props.onSelect && this.props.onSelect(this.state.model.getSelect());
    } else if (e.keyCode == KeyCode.ESCAPE) {
      return this.props.onSelect && this.props.onSelect(null);
    }

    let vect = 0;
    if (e.keyCode == KeyCode.ARROW_UP)
      vect = -1;
    else if (e.keyCode == KeyCode.ARROW_DOWN)
      vect = 1;

    if (!vect)
      return;

    if (focus == null) {
      vect = 0;
      focus = 0;
    }

    focus = clamp(focus + vect, [0, this.props.values.length - 1]);
    if (focus == this.state.model.getFocus())
      return;

    this.state.model.setFocus(focus);
    this.scrollToFocus();
    this.state.model.notify();
  }

  renderValues() {
    const values = this.state.model.getValues();
    if (values.length == 0)
      return this.props.noDataToDisplay;

    const sel: Item = this.state.model.getSelect();
    return values.map((item, idx) => this.renderItem(item, idx, sel && item.value == sel.value));
  }

  render() {
    const maxHeight = this.getMaxHeight();
    const style: React.CSSProperties = {
      ...this.props.style,
      width: this.props.width,
      maxHeight
    };

    return (
      <div
        ref={this.ref}
        className={cn(classes.class, this.props.border != false && classes.border)}
        style={style}
      >
        {this.renderValues()}
      </div>
    );
  }
}
