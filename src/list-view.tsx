import * as React from 'react';
import { className as cn } from '../common/common';
import './_list-view.scss';

const classes = {
  class: 'list-view-ctrl',
  item: 'list-item',
  select: 'select',
  border: 'border'
};

interface Item {
  value: string;
  label?: string;
}

interface Props {
  values: Array<Item>;
  value?: string;
  defaultValue?: string;
  border?: boolean;
  style?: React.CSSProperties;

  width?: number;

  onSelect?(item: Item);
}

interface State {
  value?: string;
}

export class ListView extends React.Component<Props, State> {
  state: Readonly<Partial<State>> = {};

  getValue(): string {
    return this.state.value || this.props.value || this.props.defaultValue;
  }

  renderItem = (item: Item, idx: number, select: boolean) => {
    return (
      <div
        key={idx}
        className={cn(classes.item, select && classes.select)}
        onClick={e => {
          this.props.onSelect && this.props.onSelect(item);
        }}
      >
        {item.label || item.value}
      </div>
    );
  }

  render() {
    const value = this.getValue();
    const sel = this.props.values.find(item => item.value == value);

    return (
      <div
        className={cn(classes.class, this.props.border != false && classes.border)}
        style={{...this.props.style, ...{width: this.props.width}}}
      >
        {this.props.values.map((item, idx) => this.renderItem(item, idx, sel && item.value == sel.value))}
      </div>
    );
  }
}
