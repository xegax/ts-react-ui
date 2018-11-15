import * as React from 'react';
import { className as cn } from './common/common';

const classes = {
  class: 'list-view-ctrl',
  item: 'list-item',
  select: 'select',
  border: 'border'
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

  itemsPerPage?: number;
  width?: number;

  onSelect?(item: Item);
  onItemSize?(size: number);
}

interface State {
  value?: string;
  itemSize?: number;
}

export class ListView extends React.Component<Props, State> {
  state: Readonly<Partial<State>> = {};
  ref = React.createRef<HTMLDivElement>();

  getValue(): string {
    return this.state.value || this.props.value || this.props.defaultValue;
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
        className={cn(classes.item, select && classes.select)}
        onClick={e => {
          this.props.onSelect && this.props.onSelect(item);
        }}
      >
        {jsx}
      </div>
    );
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

    const value = this.getValue();
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

  componentDidMount() {
    this.updateFirstItemSize();
  }

  render() {
    const value = this.getValue();
    const sel = this.props.values.find(item => item.value == value);
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
        {this.props.values.map((item, idx) => this.renderItem(item, idx, sel && item.value == sel.value))}
      </div>
    );
  }
}
