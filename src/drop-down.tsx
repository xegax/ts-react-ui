import * as React from 'react';
import { FitToParent } from './fittoparent';
import './_drop-down-list.scss';
import { findParent } from '../common/dom';
import { ListView } from './list-view';
import { className as cn } from '../common/common';

interface Item {
  label?: string;
  value: string;
}

interface Props {
  values: Array<Item>;

  value?: string;
  defaultValue?: string;

  width?: number;
  style?: React.CSSProperties;
}

interface State {
  value?: string;
  showList?: boolean;
}

const classes = {
  dropDown: 'drop-down-ctrl',
  dropDownPanel: 'drop-down-panel',
  showList: 'show-list',
  wrapper: 'drop-down-ctrl-wrapper',
  input: 'input-box',
  inputWrap: 'input-wrap'
};

function DropDownCont(props: Props & { show: boolean; onSelect(item: Item) }): JSX.Element {
  return (
    <div className={classes.dropDownPanel}>
      <ListView
        width={props.width}
        value={props.value}
        values={props.values}
        onSelect={props.onSelect}
      />
    </div>
  );
}

export class DropDown extends React.Component<Props, State> {
  private ref = React.createRef<HTMLDivElement>();
  state: Readonly<Partial<State>> = {};

  toggleList(showList?: boolean) {
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

  renderInput(): JSX.Element {
    const select = this.findSelected();
    return (
      <div
        className={classes.input}
        onClick={() => {
          this.toggleList();
        }}
      >
        {select ? (
          <span>{select.label || select.value}</span>
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

  renderCtrl(): JSX.Element {
    return (
      <div
        className={classes.wrapper}
        // onFocus={this.onInputFocus}
        //onKeyDown={this.onKeyDown}
      >
        <div className={classes.inputWrap} style={{ width: this.props.width }}>
          {this.renderInput()}
          <i
            className={this.isListShown() ? 'fa fa-caret-up' : 'fa fa-caret-down'}
            onClick={() => this.toggleList()}
          />
        </div>
        <FitToParent calcH = {false}>
          <DropDownCont
            {...this.props}
            show = {this.state.showList}
            value = {this.getValue()}
            onSelect = {item => {
              this.setState({ value: item.value });
              this.toggleList(false);
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
        tabIndex={0}
        className={cn(classes.dropDown, this.isListShown() && classes.showList)}
        style={style}
        onBlur={this.onInputBlur}
      >
        {this.renderCtrl()}
      </div>
    );
  }
}
