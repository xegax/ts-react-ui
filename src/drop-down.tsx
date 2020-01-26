import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ListView, ListViewModel, ListProps } from './list-view';
import { className as cn } from './common/common';
import { KeyCode } from './common/keycode';
import { Popover, Classes, PopoverLink } from './popover';
import { ElementType } from './react-common';
import { ListView as ListView2 } from './list-view2';
import { Position } from '@blueprintjs/core';

export { Position };

export interface Item {
  render?: string | ElementType<Item>;
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
  onFilter?(filter: string): Array<Item> | Promise<Array<Item>>;
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
  maxHeight?: number;
  key?: number;
}

const classes = {
  disabled: 'disabled',
  dropDown: 'drop-down-ctrl',
  dropDownPanel: 'drop-down-panel',
  showList: 'show-list',
  wrapper: 'drop-down-ctrl-wrapper',
  input: 'input-box',
  inputWrap: 'input-wrap',
  button: 'button',
  focus: 'focus',
  noData: 'no-data'
};

export class DropDown<T extends Props = Props> extends React.Component<T, State> {
  static NOTHING_SELECT: Readonly<Item> = {
    value: '-- nothing --',
    render: (item: Item) => (
      <div style={{ width: 0, color: 'silver' }}>{item.value}</div>
    )
  };

  static defaultProps: Partial<Props> = {
    itemsPerPage: 10
  };

  private input = React.createRef<HTMLInputElement>();
  private ref = React.createRef<HTMLDivElement>();
  private list = React.createRef<ListView>();
  state: Readonly<Partial<State>> = { key: 0 };

  componentDidMount() {
    if (this.props.autoFocus && this.ref && this.ref.current)
      this.ref.current.focus();
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

  renderItem(item: Item): React.ReactChild {
    if (!item.render)
      return item.value;

    if (typeof item.render != 'function')
      return item.render;

    return item.render(item);
  }

  private filterTask: Promise<any>;
  onFilter = () => {
    const filter = this.input.current.value;
    let filtered = this.props.onFilter(filter);

    const setFiltered = (filtered: Array<Item>) => {
      this.setState({ filtered });
      this.filterTask = null;
    };

    this.setState({ filter });
    if (Array.isArray(filtered)) {
      setFiltered(filtered);
    } else {
      this.filterTask && this.filterTask.cancel();
      this.filterTask =
        filtered
          .then(setFiltered)
          .catch(() => {  // filter from drop-down-loadable
            this.filterTask = null;
            this.setState({});
          });
    }
  }

  renderInput(): JSX.Element {
    return (
      <div className={classes.input}>
        <input
          autoFocus
          ref={this.input}
          placeholder={this.getValueText()}
          defaultValue={this.state.filter}
          onClick={e => {
            if (!this.state.showList)
              return;

            e.stopPropagation();
          }}
          onChange={this.onFilter}
        />
      </div>
    );
  }

  renderValue(): JSX.Element {
    if (this.state.showInput) {
      return this.renderInput();
    }

    const select = this.getValue() || DropDown.NOTHING_SELECT;
    const jsx = this.renderItem(select);
    return (
      <div className={classes.input}>
        {jsx}
      </div>
    );
  }

  onSelect = (value: Item) => {
    value && this.props.onSelect && this.props.onSelect(value);
    this.setState({
      value: value || this.state.value,
      showList: false,
      showInput: false,
      filtered: null,
      key: this.state.key + 1
    }, () => {
      if (this.ref && this.ref.current)
        this.ref.current.focus();
    });
  }

  onKeyDown = (e: React.KeyboardEvent) => {
    if (e.keyCode == KeyCode.TAB)
      return;

    const listKeys = [
      KeyCode.ARROW_DOWN,
      KeyCode.ARROW_UP,
      KeyCode.ENTER
    ];

    if (this.isListShown() && this.list.current && listKeys.indexOf(e.keyCode) != -1)
      this.list.current.onKeyDown(e);
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
    const minWidth = this.ref.current ? this.ref.current.getBoundingClientRect().width : undefined;
    const style: React.CSSProperties = {
      minWidth 
    };

    const renderList = this.props.renderList || ((props: ListProps) => {
      return (
        <ListView
          {...props}
        />
      );
    });

    const props: ListProps = {
      itemClassName: Classes.POPOVER_DISMISS,
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
      noDataToDisplay: (<div className={classes.noData}>No data</div>),
      onDidMount: () => {
        setTimeout(() => {
          this.list.current.scrollToSelect();
        }, 1);
      }
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
        >
          {this.renderValue()}
          <div className={cn(classes.button, 'border')}>
            <i
              className={cn(this.isListShown() ? 'fa fa-caret-up' : 'fa fa-caret-down')}
            />
          </div>
        </div>
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
        tabIndex={this.props.disabled ? null : 0}
        title={title}
        ref={this.ref}
        className={cn(
          classes.dropDown,
          this.isListShown() && classes.showList,
          this.props.disabled && classes.disabled,
          this.hasFocus() && classes.focus
        )}
        style={style}
        onKeyDown={this.onKeyDown}
      >
        <Popover
          key={this.state.key}
          autoFocus={false}
          disabled={this.props.disabled}
          popoverWillOpen={() => {
            this.setState({ showList: true, showInput: this.props.onFilter != null });
          }}
          popoverWillClose={() => {
            this.setState({ showList: false, showInput: false, key: this.state.key + 1 });
          }}
        >
          {this.renderCtrl()}
          {this.renderList(this.props.width)}
        </Popover>
      </div>
    );
  }
}

export interface SelectProps {
  items: Array<Item>;
  onSelect(item: Item): void;
  icon?: string;
  text?: string;
  itemsPerPage?: number;
  position?: Position;
}

export const SelectItem: React.SFC<SelectProps> = props => {
  return (
    <PopoverLink
      text={props.text}
      icon={props.icon}
      position={props.position}
    >
      <ListView2
        multiselect={false}
        itemClassName={Classes.POPOVER_DISMISS}
        itemsPerPage={props.itemsPerPage}
        values={props.items}
        onSelect={v => props.onSelect(v[0])}
      />
    </PopoverLink>
  );
}

export type SelectStringProps = {
  items: Array<string>;
  onSelect(item: string): void;
  icon?: string;
  text?: string;
  itemsPerPage?: number;
  position?: Position;
};

export const SelectString: React.SFC<SelectStringProps> = props => {
  return (
    <SelectItem
      {...props}
      items={props.items.map(value => ({ value }))}
      onSelect={v => props.onSelect(v.value)}
    />
  );
}
