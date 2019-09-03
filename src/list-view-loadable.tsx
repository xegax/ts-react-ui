import * as React from 'react';
import { Item, ListViewModel, ListView, IListView, ListProps as ListPropsBase } from './list-view';

export { ListPropsBase, Item };

export class ListViewLoadableModel extends ListViewModel {
  protected loading: Promise<void>;
  protected reverse: boolean = false;
  protected itemsPerLoad: number;

  onLoadNext: OnLoadNextCallback = () => {
    throw 'onLoadNext not defined';
  };

  getTotalValues = (): number => {
    throw 'getTotalValues not defined';
  }

  setItemsPerLoad(itemsPerLoad: number) {
    this.itemsPerLoad = itemsPerLoad;
  }

  setReverse(reverse: boolean) {
    if (reverse == null || reverse == this.reverse)
      return;
    this.reverse = reverse;
    this.reload();
  }

  appendValues(values: Array<Item>) {
    this.values.push(...values);
    let focus = this.focus;
    this.setValues(this.values, true);
    this.focus = focus;
  }

  getCount(): number {
    return this.values.length;
  }

  loadNext() {
    const totalValues = this.getTotalValues();
    const gcount = this.getCount();
    if (this.loading || gcount >= totalValues)
      return false;

    let from = gcount;
    let count = this.itemsPerLoad;
    count = Math.min(from + count, totalValues) - from;
    if (this.reverse) {
      from = totalValues - gcount - count;
    }
    
    this.loading = this.onLoadNext(from, count)
    .then(values => {
      this.loading = null;
      this.appendValues(this.reverse ? values.reverse() : values);
    })
    .catch(() => {
      this.loading = null;
      this.notify();
    });

    return true;
  }

  reload() {
    this.setValues([], true);
    this.loadNext();
  }
}

type OnLoadNextCallback = (from: number, count: number) => Promise<Array<Item>>;
export interface LoadProps {
  reverse?: boolean;
  model?: ListViewLoadableModel;
  itemsPerLoad?: number;
  totalValues(): number;
  onLoadNext: OnLoadNextCallback;
}

export type ListProps = ListPropsBase & LoadProps;

interface State {
  model?: ListViewLoadableModel;
  loading?: Promise<void>;
}

export class ListViewLoadable extends React.Component<ListProps, State> implements IListView {
  static defaultProps: Partial<ListProps> = {
    itemsPerLoad: 50,
    reverse: false
  };
  ref = React.createRef<ListView>();
  scrollTop: number = null;

  constructor(props: ListProps) {
    super(props);

    let model = props.model || new ListViewLoadableModel();
    this.state = {
      model
    };

    ListViewLoadable.getDerivedStateFromProps(props, this.state);
    if (!props.values || props.values.length == 0) {
      this.state.model.loadNext();
    }
  }

  static getDerivedStateFromProps(p: ListProps, s: State) {
    s.model.onLoadNext = p.onLoadNext;
    s.model.getTotalValues = p.totalValues;
    s.model.setItemsPerLoad(p.itemsPerLoad);
    s.model.setReverse(p.reverse);
  }

  onScroll(e: React.UIEvent) {
    const el = e.currentTarget as HTMLDivElement;
    if (this.scrollTop != null) {
      el.scrollTop = this.scrollTop;
      this.scrollTop = null;
    } else if (Math.round(el.scrollHeight - el.scrollTop - el.offsetHeight) <= 0) {
      if (this.state.model.loadNext()) {
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
    this.state.model.reload();
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
