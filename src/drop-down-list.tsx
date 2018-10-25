import * as React from 'react';
import { DropDownListModel } from './model/drop-down-list';
import { List2 } from './list2';
import { Handler, List2Item } from './model/list2';
import './_drop-down-list.scss';
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

interface Props<T> {
  width?: number;
  model?: DropDownListModel<T>;
  render?(item: List2Item<T>, idx: number): JSX.Element | string;
  items?: Array<T> | ( (from: number, count: number) => Promise<Array< List2Item<T> >> );
  onSelect?(item: Array<List2Item<T>>);
  onFilterChanged?(filter: string);
  onFilter?(item: T, filter: string): boolean;  // to filter local data
}

interface State<T> {
  model?: DropDownListModel<T>;
  showList?: boolean;
  selection?: Array<List2Item<T>>;
}

export class DropDownList<T> extends React.Component<Props<T>, State<T>> {
  private ref = React.createRef<HTMLDivElement>();
  private list = React.createRef<List2<T>>();
  private input = React.createRef<HTMLInputElement>();
  private focus = false;
  private filtered: Array<List2Item<T>>;

  constructor(props: Props<T>) {
    super(props);

    const model = props.model || new DropDownListModel<T>();
    this.state = { model, selection: model.getSelectedItems() || [] };

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

    model.setFilterable(!!props.onFilter || !!props.onFilterChanged);
    model.subscribe(() => {
      const filter = model.getFilter();
      if (props.onFilterChanged)
        props.onFilterChanged(filter);

      if (!props.onFilter || !Array.isArray(props.items))
        return;

      if (!filter || !filter.trim()) {
        this.filtered = null;
      } else {
        this.filtered = props.items.map((item, i) => ({
          id: i + '',
          label: item['label'],
          data: item
        })).filter(item => props.onFilter(item.data, filter));
      }

      this.state.model.clear({ reload: true });
    }, 'filter');

    model.setHandler(handler);
  }

  loadNext = (from: number, count: number): Promise< Array<List2Item<T>> > => {
    if (!Array.isArray(this.props.items))
      return Promise.reject();

    if (this.filtered)
      return Promise.resolve(this.filtered.slice(from, from + count));

    const slice = this.props.items.slice(from, from + count);
    return (
      Promise.resolve(slice.map((data, i) => ({
        id: i + '',
        label: data['label'],
        data
      })))
    );
  }

  onSelect(selection: Array<List2Item<T>>) {
    this.setState({ selection });
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
  }

  componentWillUnmount() {
    this.state.model.unsubscribe(this.subscriber);
  }

  onClick = () => {
    this.setState({ showList: !this.state.showList });
  }

  onInputBlur = (event: React.FocusEvent<any>) => {
    if(findParent(event.nativeEvent.relatedTarget as HTMLElement, this.ref.current))
      return;

    this.focus = false;
    this.closeList();
  }

  closeList() {
    this.setState({ showList: false });
    this.state.model.delayedNotify({ type: 'close-list' });
  }

  onInputFocus = () => {
    this.focus = true;
  }

  onKeyDown = (event: React.KeyboardEvent<any>) => {
    if (!this.state.showList && event.keyCode != KeyCode.TAB) {
      return this.setState({ showList: true });
    }

    if (!this.list || !this.list.current)
      return;

    this.list.current.onKeyDown(event);
  }

  getSelStr(): string {
    return (this.state.selection || []).map(item => item.label || item.data.toString()).join(', ');
  }

  renderInput(): JSX.Element {
    if (this.focus && this.state.model.isFilterable()) {
      return (
        <input
          onClick={this.onClick}
          onChange={event => {
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
      return (
        <div className={classes.input} onClick={this.onClick}>
          {this.getSelStr()}
        </div>
      );
    }
  }

  renderCtrl(): JSX.Element {
    const listStyle: React.CSSProperties = {
      maxHeight: 300,
      display: !this.state.showList ? 'none' : null,
      position: 'absolute',
      zIndex: 1000
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
          <i className={this.state.showList ? 'fa fa-caret-up' : 'fa fa-caret-down'} onClick={this.onClick}/>
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
    const style: React.CSSProperties = {};
    if (this.props.width != null)
      style.display = 'inline-block';

    return (
      <div className={classes.dropDown} style={style}>
        {this.renderCtrl()}
      </div>
    );
  }
}
