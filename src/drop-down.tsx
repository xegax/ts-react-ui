import * as React from 'react';
import { FitToParent } from './fittoparent';
import { findParent } from './common/dom';
import { ListView } from './list-view';
import { className as cn } from './common/common';
import { KeyCode } from './common/keycode';

interface Item {
  render?: string | JSX.Element | ((item: Item, jsx: JSX.Element) => JSX.Element);
  value: string;
}

interface Props {
  enabled?: boolean;
  values: Array<Item>;
  itemsPerPage?: number;

  value?: string;
  defaultValue?: string;

  onSelect?(item: Item);
  onFilter?(filter: string): Array<Item>;

  width?: number;
  style?: React.CSSProperties;
}

interface ListProps {
  values: Array<Item>;
  value?: string;
  width?: number;
  onSelect(item: Item);
  onItemSize?(size: number);
  itemsPerPage?: number;
  itemSize?: number;
  refList?: React.RefObject<ListView>;
}

interface State {
  value?: string;
  showList?: boolean;
  itemSize?: number;
  filtered?: Array<Item>;
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
  focus:          'focus'
};

function DropDownCont(props: ListProps): JSX.Element {
  const style: React.CSSProperties = {
    width: props.width,
    visibility: !props.itemsPerPage || props.itemSize ? null : 'hidden'
  };

  return (
    <div className={cn(classes.dropDownPanel, 'border')} style={style}>
      <ListView
        ref = {props.refList}
        border = {false}
        itemsPerPage = {props.itemsPerPage}
        value = {props.value}
        values = {props.values}
        onSelect = {props.onSelect}
        onItemSize = {props.onItemSize}
      />
    </div>
  );
}

export class DropDown extends React.Component<Props, State> {
  static defaultProps: Partial<Props> = {
    itemsPerPage: 10,
    enabled: true
  };

  private input = React.createRef<HTMLInputElement>();
  private ref = React.createRef<HTMLDivElement>();
  private list = React.createRef<ListView>();
  state: Readonly<Partial<State>> = {};

  toggleList(args?: Partial<{showList: boolean, blur?: boolean}>) {
    if (!this.props.enabled)
      return;

    args = {...{ showList: !this.state.showList, blur: false }, ...args};

    const state: State = { showList: args.showList };
    if (args.blur)
      state.filtered = null;

    this.setState(state, () => {
      args.showList && this.list.current.scrollToFocus();
    });
  }

  getValue(): string {
    return this.props.value || this.state.value || this.props.defaultValue;
  }

  getValues(): Array<Item> {
    return this.state.filtered || this.props.values;
  }

  findSelected(): Item {
    const value = this.getValue();
    return this.getValues().find(item => item.value == value);
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

  renderInput(): JSX.Element {
    if (this.isFilterable() && this.hasFocus()) {
      return (
        <div className={classes.input}>
          <input
            autoFocus
            ref = {this.input}
            onFocus = {() => {
              this.toggleList();
            }}
            onChange = {() => {
              this.setState({ filtered: this.props.onFilter(this.input.current.value) });
            }}
          />
        </div>
      );
    }

    const select = this.findSelected();
    return (
      <div className={classes.input}>
        {select ? (
          this.renderItem(select)
        ) : (
          <span style={{visibility: 'hidden'}}>.</span>
        )}
      </div>
    );
  }

  onInputBlur = (event: React.FocusEvent<any>) => {
    setTimeout(() => this.setState({}), 5);

    if(findParent(event.relatedTarget as HTMLElement, this.ref.current))
      return;

    this.toggleList({ showList: false });
  }

  onSelect = (item: Item) => {
    this.setState({
      value: item ? item.value : null,
      showList: false
    }, () => {
      item && this.props.onSelect && this.props.onSelect(item);
      if (this.input) {
        this.input.current.value = this.state.value;
        this.input.current.focus();
      }
    });
  }

  onKeyDown = (e: React.KeyboardEvent) => {
    if (!this.isListShown()) {
      this.toggleList({ showList: true });
    } else if (this.list.current) {
      this.list.current.onKeyDown(e);
    }

    if (this.input.current)
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

  renderCtrl(): JSX.Element {
    return (
      <div
        className={classes.wrapper}
        // onFocus={this.onInputFocus}
      >
        <div
          className={cn(classes.inputWrap, 'border')}
          style={{ width: this.props.width }}
          onClick={() => this.toggleList()}
        >
          {this.renderInput()}
          <div className={cn(classes.button, 'border')}>
            <i
              className={cn(this.isListShown() ? 'fa fa-caret-up' : 'fa fa-caret-down')}
            />
          </div>
        </div>
        <FitToParent calcH = {false}>
          <DropDownCont
            refList = { this.list }
            width = { this.props.width }
            values = {this.getValues()}
            value = {this.getValue()}
            onSelect = {item => this.onSelect(item)}

            itemSize = {this.state.itemSize}
            itemsPerPage = {this.props.itemsPerPage}
            onItemSize = {itemSize => {
              this.setState({ itemSize });
            }}
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
      <div
        ref={this.ref}
        tabIndex={!this.props.enabled ? null : 0}
        className={cn(
          classes.dropDown,
          this.isListShown() && classes.showList,
          !this.props.enabled && classes.disabled,
          this.hasFocus() && classes.focus
        )}
        style={style}
        onKeyDown={this.onKeyDown}
        onFocus={() => this.setState({})}
        onBlur={this.onInputBlur}
      >
        {this.renderCtrl()}
      </div>
    );
  }
}
