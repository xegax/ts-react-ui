import * as React from 'react';
import { Item, ListViewModel, ListView, IListView, ListProps as ListPropsBase } from './list-view';

export { ListPropsBase, Item };

export class ListViewLoadableModel extends ListViewModel {
  appendValues(values: Array<Item>) {
    this.values.push(...values);
    let focus = this.focus;
    this.setValues(this.values, true);
    this.focus = focus;
  }

  getCount(): number {
    return this.values.length;
  }
}

export interface LoadProps {
  model?: ListViewLoadableModel;
  itemsPerLoad?: number;
  totalValues(): number;
  onLoadNext(from: number, count: number): Promise<Array<Item>>;
}

export type ListProps = ListPropsBase & LoadProps;

interface State {
  model?: ListViewLoadableModel;
}

export class ListViewLoadable extends React.Component<ListProps, State> implements IListView {
  static defaultProps: Partial<ListProps> = {
    itemsPerLoad: 50
  };
  ref = React.createRef<ListView>();

  scrollTop: number = null;
  loading: Promise<any>;

  constructor(props: ListProps) {
    super(props);

    let model = props.model || new ListViewLoadableModel();
    this.state = { model };

    if (!props.values || props.values.length == 0) {
      this.loadNext();
    }
  }

  loadNext() {
    const totalValues = this.props.totalValues();
    if (this.loading || this.state.model.getCount() >= totalValues)
      return false;

    const from = this.state.model.getCount();
    let count = this.props.itemsPerLoad;
    count = Math.min(from + count, totalValues) - from;
    
    this.loading = this.props.onLoadNext(from, count)
    .then(values => {
      this.loading = null;
      this.state.model.appendValues(values);
    })
    .catch(() => {
      this.loading = null;
    });

    return true;
  }

  onScroll(e: React.UIEvent) {
    const el = e.currentTarget as HTMLDivElement;
    if (this.scrollTop != null) {
      el.scrollTop = this.scrollTop;
      this.scrollTop = null;
    } else if (Math.round(el.scrollHeight - el.scrollTop - el.offsetHeight) <= 0) {
      if (this.loadNext()) {
        this.scrollTop = e.currentTarget.scrollTop;
      }
    }
  }

  onKeyDown(e: React.KeyboardEvent) {
    this.ref.current.onKeyDown(e);
  }

  scrollToSelect() {
    this.ref.current.scrollToSelect();
  }

  getModel(): ListViewLoadableModel {
    return this.state.model;
  }

  reload() {
    this.state.model.setValues([], true);
    this.loadNext();
  }

  render() {
    const props = { ...this.props, model: this.state.model };
    return (
      <ListView
        ref={this.ref}
        {...props}
        onScroll={e => this.onScroll(e)}
      />
    );
  }
}
