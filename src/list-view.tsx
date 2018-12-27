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

export interface Item {
  value: string;
  render?: string | JSX.Element | ((item: Item, jsx: JSX.Element) => JSX.Element);
}

export interface ListProps {
  values: Array<Item>;
  value?: Item;
  defaultValue?: Item;
  border?: boolean;
  style?: React.CSSProperties;
  dummy?: number;

  itemsPerPage?: number;
  width?: number;
  height?: number;
  maxHeight?: number;
  model?: ListViewModel;

  onSelect?(item: Item);
  onItemSize?(size: number);
  onScroll?(event: React.UIEvent);
  noDataToDisplay?: JSX.Element;
  ref?: React.RefObject<any>;
}

interface State {
  itemSize?: number;
  scrollTop?: number;
  model?: ListViewModel;
}

export class ListViewModel extends Publisher {
  protected values = Array<Item>();
  protected focus: number;
  protected select: Item;

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

  setValues(values: Array<Item>, force?: boolean) {
    if (!values || force != true && this.values == values)
      return false;

    this.values = values;
    this.focus = null;
    this.delayedNotify({ type: 'values' });
    return true;
  }

  getValues() {
    return this.values;
  }

  isEqual(value1: Item, value2: Item): boolean {
    return value1.value == value2.value;
  }

  setValue(value: Item, notify?: boolean) {
    if (this.select && this.isEqual(this.select, value))
      return;

    let newSelect = this.select;
    let newFocus = this.focus;

    const idx = this.values.findIndex(v => this.isEqual(value, v));
    if (idx != -1) {
      newSelect = this.values[idx];
      newFocus = idx;
    } else {
      newSelect = undefined;
      newFocus = -1;
    }

    if (this.select == newSelect && this.focus == newFocus)
      return;

    this.select = newSelect;
    this.focus = newFocus;

    if (notify == false)
      return;

    this.delayedNotify({ type: 'select' });
  }

  setValueByIndex(idx: number, notify?: boolean): boolean {
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

  getSelect(): Item {
    return this.select;
  }
}

export interface IListView {
  onKeyDown(e: React.KeyboardEvent);
  scrollToSelect();
}

export class ListView extends React.Component<ListProps, State> implements IListView {
  state: Readonly<Partial<State>> = {};
  ref = React.createRef<HTMLDivElement>();

  constructor(props: ListProps) {
    super(props);

    const model = props.model || new ListViewModel();
    /*model.subscribe(() => {
      if (this.ref && this.ref.current)
        this.ref.current.scrollTop = 0;
    }, 'values');*/

    model.setValues(props.values);
    this.state = { model };
  }

  static getDerivedStateFromProps(props: ListProps, state: State) {
    state.model.setValues(props.values);

    if (!state.model.getSelect() && props.defaultValue)
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

  scrollToSelect() {
    const sel = this.state.model.getSelect();
    if (!sel)
      return false;

    const idx = this.state.model.getValues().indexOf(sel);
    if (!idx)
      return false;

    this.scrollToIndex(idx);
  }

  scrollToFocus() {
    this.scrollToIndex(this.state.model.getFocus());
  }

  scrollToIndex(index: number) {
    const ctrl = this.ref.current;
    const el = ctrl.childNodes.item(index) as HTMLElement;
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
    if (!this.ref.current || !this.ref.current.children || this.ref.current.children.length == 0)
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

    const value = this.state.model.getSelect();
    if (!value)
      return false;

    const idx = this.props.values.indexOf(value);
    if (idx == -1)
      return false;
    
    this.ref.current.scrollTop = idx * this.state.itemSize;
    return true;
  }

  findFirstVisibleIndex(): number {
    let parent = this.ref.current;
    let bb = parent.getBoundingClientRect();
    for (let n = 0; n < parent.children.length; n++) {
      const node = parent.children.item(n) as HTMLElement;
      const nodeBB = node.getBoundingClientRect();
      if (bb.top - nodeBB.top <= 0)
        return n;
    }

    return -1;
  }

  onKeyDown = (e: React.KeyboardEvent) => {
    if (!this.props.onSelect)
      return;

    let focus = this.state.model.getFocus();
    if (e.keyCode == KeyCode.ENTER && this.state.model.setValueByIndex(focus)) {
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
      focus = this.findFirstVisibleIndex();
      vect = 0;
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

  renderItem(item: Item, idx: number, select: boolean) {
    let jsx: JSX.Element | string;
    if (typeof item.render != 'function')
      jsx = item.render || item.value || '';
    else
      jsx = item.render(item, <>{item.value}</>);

    if (typeof jsx == 'string' && jsx.trim() == '')
      jsx = <span style={{visibility: 'hidden'}}>?</span>;

    return (
      <div
        key={idx}
        title={this.getLabel(item)}
        className={cn(classes.item, select && classes.select, idx == this.state.model.getFocus() && classes.focus)}
        onClick={e => {
          if (!this.props.onSelect)
            return;

          this.state.model.setValue(item);
          this.state.model.notify();

          this.props.onSelect(item);
        }}
      >
        {jsx}
      </div>
    );
  }

  onScroll(e: React.UIEvent) {
    this.props.onScroll && this.props.onScroll(e);
  }

  render() {
    let maxHeight = this.getMaxHeight();
    if (this.props.maxHeight)
      maxHeight = Math.min(maxHeight, this.props.maxHeight);

    const style: React.CSSProperties = {
      ...this.props.style,
      width: this.props.width,
      height: this.props.height,
      maxHeight
    };

    return (
      <div
        ref={this.ref}
        className={cn(classes.class, this.props.border != false && classes.border)}
        style={style}
        onScroll={e => this.onScroll(e)}
      >
        {this.renderValues()}
      </div>
    );
  }
}
