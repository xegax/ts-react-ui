import * as React from 'react';
import { DropDownListModel } from './model/drop-down-list';
import { List2 } from './list2';
import { Handler, List2Item, List2ItemData } from './model/list2';
import { FitToParent } from './fittoparent';
import { findParent } from './common/dom';
import { KeyCode } from './common/keycode';

export { DropDownListModel, List2Item };

const classes = {
  dropDown: 'drop-down-list-ctrl',
  wrapper: 'drop-down-list-ctrl-wrapper',
  input: 'input-box',
  inputWrap: 'input-wrap'
};

interface Props<T = List2ItemData> {
  autoFocus?: boolean;
  autoOpen?: boolean;
  width?: number;
  model?: DropDownListModel<T>;
  render?(item: List2Item<T>, idx: number): JSX.Element | string;
  items?: Array<T> | Array<string> | ( (from: number, count: number) => Promise<Array< List2Item<T> >> );
  select?: Array<T>;
  onSelect?(item: Array<List2Item<T>>);
  onFilterChanged?(filter: string);
  onFilter?(item: T, filter: string): boolean;  // to filter local data
  style?: React.CSSProperties;
}

interface State<T> {
  model?: DropDownListModel<T>;
  showList?: boolean;
}

function fromLocal<T>(item: T, idx: number): List2Item<T> {
  const listItem: List2Item<T> = {
    id: idx + '',
    data: item
  };

  if (typeof item != 'string' && item['label'])
    listItem.label = item['label'];
  else if (typeof item == 'string')
    listItem.label = item;

  return listItem;
}

export class DropDownList<T = List2ItemData> extends React.Component<Props<T>, State<T>> {
  private ref = React.createRef<HTMLDivElement>();
  private list = React.createRef<List2<T>>();
  private input = React.createRef<HTMLInputElement>();
  private focus = false;
  private filtered: Array< List2Item<T> >;

  constructor(props: Props<T>) {
    super(props);

    const model = props.model || new DropDownListModel<T>();
    this.state = { model, showList: props.autoOpen == true };

    const handler = { ...model.getHandler() } as Handler<T>;

    if (props.items) {
      if (Array.isArray(props.items))
        handler.loadNext = this.loadNext;
      else
        handler.loadNext = props.items;
    }

    model.subscribe(() => {
      this.onSelect(model.getSelectedItems() || []);
    }, 'select');

    if (props.render)
      handler.render = props.render;
    model.setHandler(handler);

    if (props.onFilter || props.onFilterChanged)
      model.setFilterable(!!props.onFilter || !!props.onFilterChanged);

    if (props.select && Array.isArray(props.items)) {
      model.loadNext().then(() => {
        (props.items as Array<T>).forEach((item, i) => {
          if (item as any != props.select)
            return;

          const v = fromLocal(item, i);
          model.setSelect({ id: v.id, clear: i == 0, notify: false });
        });
      });
    }

    model.subscribe(() => {
      const filter = model.getFilter();
      if (props.onFilterChanged)
        props.onFilterChanged(filter);

      if (!this.state.model.isFilterable() || !Array.isArray(props.items))
        return;

      if (!filter || !filter.trim()) {
        this.filtered = null;
      } else {
        const items = props.items as Array<T>;
        this.filtered = items.map(fromLocal).filter(item => this.filter(item.data, filter));
      }

      this.state.model.clear({ reload: true });
    }, 'filter');
  }

  filter(item: T, filter: string): boolean {
    const filterImpl = this.props.onFilter;
    if (filterImpl)
      return filterImpl(item, filter);

    let label: string;
    if (typeof item == 'string')
      label = item;
    
    if (typeof item['label'] == 'string')
      label = item['label'];

    if (label != null)
      return label.indexOf(filter) != -1;

    return false;
  }

  loadNext = (from: number, count: number): Promise< Array<List2Item<T>> > => {
    if (!Array.isArray(this.props.items))
      return Promise.reject(new Error('items must be array'));

    if (this.filtered)
      return Promise.resolve(this.filtered.slice(from, from + count));

    const items = this.props.items as Array<T>;
    return (
      Promise.resolve(items.slice(from, from + count).map(fromLocal))
    );
  }

  static getDerivedStateFromProps(props: Props, state: State<any>): State<any> | null {
    if (props.select && Array.isArray(props.items)) {
      (props.items as Array<any>).forEach((item, i) => {
        if (item as any != props.select)
          return;

        const v = fromLocal(item, i);
        state.model.setSelect({ id: v.id, clear: i == 0, notify: false });
      });
    }

    return null;
  }

  onSelect(selection: Array<List2Item<T>>) {
    this.setState({});
    this.props.onSelect && this.props.onSelect( selection );
    if (this.input && this.input.current)
      this.input.current.value = this.getSelStr();
    this.closeList();
  }

  subscriber = () => {
    this.setState({});
  }

  componentDidMount() {
    this.state.model.subscribe(this.subscriber);
    if (this.props.autoFocus)
      this.ref.current.focus();
  }

  protected getListPos() {
    if (!this.ref.current)
      return 0;

    return this.ref.current.getBoundingClientRect().bottom;
  }

  componentWillUnmount() {
    this.state.model.unsubscribe(this.subscriber);
  }

  onInputClick = () => {
    this.toggleList(true);
  }

  toggleList(showList?: boolean) {
    if (showList == null)
      showList = !this.state.showList;

    this.setState({ showList });
  }

  onInputBlur = (event: React.FocusEvent<any>) => {
    if(findParent(event.relatedTarget as HTMLElement, this.ref.current))
      return;

    this.focus = false;
    this.closeList();
  }

  closeList() {
    if (this.state.showList)
      this.ref.current.focus();

    this.setState({ showList: false });
    this.state.model.setFilter('');
    this.state.model.delayedNotify({ type: 'close-list' });
  }

  onInputFocus = () => {
    this.focus = true;
  }

  onKeyDown = (event: React.KeyboardEvent<any>) => {
    if (!this.state.showList && event.keyCode != KeyCode.TAB) {
      event.preventDefault();
      return this.setState({ showList: true });
    }

    if (!this.list || !this.list.current)
      return;

    this.list.current.onKeyDown(event);
  }

  getSelStr(): string {
    return (this.state.model.getSelectedItems() || []).map(item => item.label || item.data.toString()).join(', ');
  }

  renderInput(): JSX.Element {
    if (this.focus && this.state.model.isFilterable()) {
      return (
        <input
          onClick={this.onInputClick}
          onChange={() => {
            if (this.state.model.isFilterable())
              this.state.model.setFilter(this.input.current.value);
          }}
          defaultValue={this.getSelStr()}
          ref={this.input}
          className={classes.input}
          autoFocus
        />
      );
    } else {
      const sel = this.state.model.getSelectedItems();
      return (
        <div className={classes.input} onClick={() => this.toggleList()}>
          {sel.length ? this.state.model.render(sel[0], 0) : <span style={{visibility: 'hidden'}}>.</span> }
        </div>
      );
    }
  }

  renderCtrl(): JSX.Element {
    const listStyle: React.CSSProperties = {
      maxHeight: 300,
      display: !this.state.showList ? 'none' : null,
      position: 'absolute',
      zIndex: 1000,
      top: this.getListPos()
    };

    return (
      <div
        ref={this.ref}
        tabIndex={0}
        className={classes.wrapper}
        onFocus={this.onInputFocus}
        onBlur={this.onInputBlur}
        onKeyDown={this.onKeyDown}
      >
        <div className={classes.inputWrap} style={{ width: this.props.width != null ? this.props.width : null }}>
          {this.renderInput()}
          <i className={this.state.showList ? 'fa fa-caret-up' : 'fa fa-caret-down'} onClick={() => this.toggleList()}/>
        </div>
        <FitToParent calcH={false}>
          <List2
            ref={this.list}
            model={this.state.model}
            style={listStyle}
          />
        </FitToParent>
      </div>
    );
  }

  render() {
    const style: React.CSSProperties = {...this.props.style};
    if (this.props.width != null)
      style.display = 'inline-block';

    return (
      <div className={classes.dropDown} style={style}>
        {this.renderCtrl()}
      </div>
    );
  }
}
