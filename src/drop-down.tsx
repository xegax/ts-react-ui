import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { FitToParent } from './fittoparent';
import { findParent } from './common/dom';
import { ListView, IListView, ListViewModel, ListProps } from './list-view';
import { className as cn } from './common/common';
import { KeyCode } from './common/keycode';
import { ExtPromise, Cancelable } from 'objio';

export interface Item {
  render?: string | JSX.Element | ((item: Item, jsx: JSX.Element) => JSX.Element);
  value: string;
}

export interface Props {
  autoFocus?: boolean;
  disabled?: boolean;
  values?: Array<Item>;
  itemsPerPage?: number;
  listModel?: ListViewModel;

  value?: Item;
  defaultValue?: Item;

  onSelect?(item: Item);
  onFilter?(filter: string): Array<Item> | Promise< Array<Item> >;
  onScroll?(event: React.UIEvent);
  renderList?(props: ListProps): JSX.Element;

  width?: number;
  style?: React.CSSProperties;
}

interface State {
  value?: Item;
  showList?: boolean;
  showInput?: boolean;
  itemSize?: number;
  filter?: string;
  filtered?: Array<Item>;
  offset?: number;
  maxHeight?: number;
}

const classes = {
  disabled:       'disabled',
  dropDown:       'drop-down-ctrl',
  dropDownPanel:  'drop-down-panel',
  showList:       'show-list',
  wrapper:        'drop-down-ctrl-wrapper',
  input:          'input-box',
  inputWrap:      'input-wrap',
  button:         'button',
  focus:          'focus',
  noData:         'no-data'
};

export class DropDown<T extends Props = Props> extends React.Component<T, State> {
  private static active: DropDown;

  static getActive(): DropDown {
    return DropDown.active;
  }

  static defaultProps: Partial<Props> = {
    itemsPerPage: 10
  };

  private input = React.createRef<HTMLInputElement>();
  private ref = React.createRef<HTMLDivElement>();
  private list = React.createRef<IListView>();
  state: Readonly<Partial<State>> = {};
  _state: Readonly<Partial<State>> = {};

  setState(state: Partial<State>, callback?: () => void) {
    this._state = { ...this.state, ...state };
    super.setState(state, callback);
  }

  componentDidMount() {
    if (this.props.autoFocus && this.ref && this.ref.current)
      this.ref.current.focus();
  }

  static getDerivedStateFromProps(props: ListProps, state: State): State {
    return null;
  }

  getBottomOffset() {
    if (!this.ref.current)
      return null;

    const bottom = this.ref.current.getBoundingClientRect().bottom;
    const listHeight = ReactDOM.findDOMNode(this.list.current).offsetHeight;
    let parent: HTMLElement = this.ref.current;
    while (parent) {
      if (['relative', 'absolute'].indexOf(parent.style.position) != -1) {
        let rect = parent.getBoundingClientRect();
        return {
          offset: bottom - rect.top,
          maxHeight: window.innerHeight - ( bottom - rect.top )
        };
      }
      parent = parent.parentElement;
    }

    
    return {
      offset: bottom,
      maxHeight: window.innerHeight - bottom
    };
  }

  toggleList() {
    if (this.props.disabled)
      return;

    const showList = !this._state.showList;
    const showInput = this.isFilterable() && showList;
    let offset = this._state.offset;
    let maxHeight = this._state.maxHeight;
    if (showList) {
      DropDown.active = this;
      const res = this.getBottomOffset();
      if (res) {
        offset = res.offset;
        maxHeight = res.maxHeight;
      }
    } else {
      DropDown.active = null;
    }

    this.setState({ showList, showInput, offset, maxHeight }, () => {
      this._state.showList && !this._state.showInput && this.ref.current.focus();
      this._state.showList && this.list.current.scrollToSelect();
    });
  }

  hideList() {
    DropDown.active = null;
    this.setState({
      showList: false,
      filtered: null,
      showInput: false
    });
  }

  isListView(e: HTMLDivElement) {
    return ReactDOM.findDOMNode(this.list.current) == e;
  }

  getValue(): Item {
    let value = this.props.value;
    if (value)
      value = this.getValues().find(item => item.value == value.value) || value;

    return value || this.state.value || this.props.defaultValue;
  }

  getValueText(): string {
    const item = this.getValue();
    return item && item.value || '';
  }

  getValues(defaults?: Array<Item>): Array<Item> {
    return (
      this.state.filtered || this.props.values ||
      this.props.listModel && this.props.listModel.getValues() || defaults
    );
  }

  isListShown(): boolean {
    return this.state.showList;
  }

  renderItem(item: Item): JSX.Element | string {
    if (!item.render)
      return item.value;

    if (typeof item.render != 'function')
      return item.render;

    return item.render(item, <>{item.value}</>);
  }

  private filterTask: Cancelable;
  onFilter = () => {
    const filter = this.input.current.value;
    let filtered = this.props.onFilter(filter);

    const setFiltered = (filtered: Array<Item>) => {
      this.setState({ filtered });
      this.filterTask = null;
    };

    this.setState({ filter });
    if (Array.isArray(filtered)) {
      setFiltered( filtered );
    } else {
      this.filterTask && this.filterTask.cancel();
      this.filterTask = ExtPromise()
        .cancelable(
          filtered
          .then(setFiltered)
          .catch(() => {  // filter from drop-down-loadable
            this.filterTask = null;
            this.setState({});
          })
        );
    }
  }

  renderInput(): JSX.Element {
    return (
      <div className={classes.input}>
        <input
          autoFocus
          ref = {this.input}
          placeholder = {this.getValueText()}
          defaultValue = {this.state.filter}
          onClick = {e => {
            if (!this.state.showList)
              return;

            e.stopPropagation();
            e.preventDefault();
          }}
          onChange = {this.onFilter}
        />
      </div>
    );
  }

  renderValue(): JSX.Element {
    if (this.state.showInput) {
      return this.renderInput();
    }

    const select = this.getValue();
    return (
      <div className={classes.input}>
        {select ? (
          this.renderItem(select)
        ) : (
          <div style={{ width: 0, color: 'silver' }}>-- nothing --</div>
        )}
      </div>
    );
  }

  onInputBlur = (event: React.FocusEvent<any>) => {
    if(findParent(event.relatedTarget as HTMLElement, this.ref.current))
      return;

    this.hideList();
  }

  onSelect = (value: Item) => {
    value && this.props.onSelect && this.props.onSelect(value);
    this.setState({
      value: value || this.state.value,
      showList: false,
      showInput: false,
      filtered: null
    }, () => {
      if (this.ref && this.ref.current)
        this.ref.current.focus();
    });
  }

  onKeyDown = (e: React.KeyboardEvent) => {
    if (e.keyCode == KeyCode.TAB)
      return;

    if (!this.isListShown()) {
      this.toggleList();
    } else if (this.list.current) {
      this.list.current.onKeyDown(e);
    }

    if (this.input.current && [ KeyCode.ARROW_DOWN, KeyCode.ARROW_UP ].indexOf(e.keyCode) == -1)
      return;

    e.preventDefault();
    e.stopPropagation();
  }

  isFilterable(): boolean {
    return this.props.onFilter != null;
  }

  hasFocus(): boolean {
    return (
      document.activeElement == this.ref.current ||
      document.activeElement == this.input.current
    );
  }

  renderList = (width: number) => {
    const style: React.CSSProperties = {
      width,
      visibility: !this.props.itemsPerPage || this.state.itemSize ? null : 'hidden',
      top: this.state.offset
    };
  
    const renderList = this.props.renderList || ((props: ListProps) => {
      return (
        <ListView {...props}/>
      );
    });

    const props: ListProps = {
      maxHeight: this.state.maxHeight,
      ref: this.list,
      model: this.props.listModel,
      border: false,
      itemsPerPage: this.props.itemsPerPage,
      value: this.getValue(),
      values: this.getValues(),
      onSelect: item => this.onSelect(item),
      onScroll: this.props.onScroll,
      onItemSize: itemSize => this.setState({ itemSize }),
      noDataToDisplay: (<div className={classes.noData}>No data</div>)
    };
  
    return (
      <div className={cn(classes.dropDownPanel, 'border')} style={style}>
        {renderList(props)}
      </div>
    );
  }

  renderCtrl(): JSX.Element {
    return (
      <div
        className={classes.wrapper}
      >
        <div
          className={cn(classes.inputWrap, 'border')}
          style={{ width: this.props.width }}
          onClick={() => {
            this.toggleList();
          }}
        >
          {this.renderValue()}
          <div className={cn(classes.button, 'border')}>
            <i
              className={cn(this.isListShown() ? 'fa fa-caret-up' : 'fa fa-caret-down')}
            />
          </div>
        </div>
        <FitToParent render={this.renderList}/>
      </div>
    );
  }

  render() {
    const style: React.CSSProperties = { ...this.props.style as any };
    if (this.props.width != null)
      style.display = 'inline-block';

    const select = this.getValue();
    const title = select && (typeof select.render == 'string' && select.render || select.value) || '';
    return (
      <div
        title={title}
        ref={this.ref}
        tabIndex={this.props.disabled ? null : 0}
        className={cn(
          classes.dropDown,
          this.isListShown() && classes.showList,
          this.props.disabled && classes.disabled,
          this.hasFocus() && classes.focus
        )}
        style={style}
        onKeyDown={this.onKeyDown}
        onBlur={this.onInputBlur}
      >
        {this.renderCtrl()}
      </div>
    );
  }
}
