import * as React from 'react';
import { FitToParent } from './fittoparent';
import { findParent } from './common/dom';
import { ListView } from './list-view';
import { className as cn } from './common/common';

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
}

interface State {
  value?: string;
  showList?: boolean;
  itemSize?: number;
}

const classes = {
  disabled:       'disabled',
  dropDown:       'drop-down-ctrl',
  dropDownPanel:  'drop-down-panel',
  showList:       'show-list',
  wrapper:        'drop-down-ctrl-wrapper',
  input:          'input-box',
  inputWrap:      'input-wrap',
  button:         'button'
};

function DropDownCont(props: ListProps): JSX.Element {
  const style: React.CSSProperties = {
    width: props.width,
    visibility: !props.itemsPerPage || props.itemSize ? null : 'hidden'
  };

  return (
    <div className={cn(classes.dropDownPanel, 'border')} style={style}>
      <ListView
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

  private ref = React.createRef<HTMLDivElement>();
  state: Readonly<Partial<State>> = {};

  toggleList(showList?: boolean) {
    if (!this.props.enabled)
      return;

    if (showList == null)
      showList = !this.state.showList;

    this.setState({ showList });
  }

  getValue(): string {
    return this.props.value || this.state.value || this.props.defaultValue;
  }

  findSelected(): Item {
    const value = this.getValue();
    return this.props.values.find(item => item.value == value);
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
    if(findParent(event.relatedTarget as HTMLElement, this.ref.current))
      return;

    this.toggleList(false);
  }

  onSelect = (item: Item) => {
    this.setState({
      value: item.value,
      showList: false
    });
    this.props.onSelect && this.props.onSelect(item);
  }

  renderCtrl(): JSX.Element {
    return (
      <div
        className={classes.wrapper}
        // onFocus={this.onInputFocus}
        //onKeyDown={this.onKeyDown}
      >
        <div className={cn(classes.inputWrap, 'border')} style={{ width: this.props.width }}>
          {this.renderInput()}
          <div className={cn(classes.button, 'border')}>
            <i
              className={cn(this.isListShown() ? 'fa fa-caret-up' : 'fa fa-caret-down')}
              onClick={() => this.toggleList()}
            />
          </div>
        </div>
        <FitToParent calcH = {false}>
          <DropDownCont
            width = { this.props.width }
            values = {this.props.values}
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
          !this.props.enabled && classes.disabled
        )}
        style={style}
        onClick={() => {
          this.toggleList();
        }}
        onBlur={this.onInputBlur}
      >
        {this.renderCtrl()}
      </div>
    );
  }
}
