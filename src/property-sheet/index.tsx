import * as React from 'react';
import { PropertyItem, PropItemGroup } from './property-item';
import { PropertySheetModel } from './property-sheet-model';
import { className as cn } from '../common/common';
import { findParent } from '../common/dom';
import { KeyCode } from '../common/keycode';
import { DropDownList } from '../drop-down-list';
import '../_property-sheet.scss';

export { PropertyItem, PropItemGroup };

const classes = {
  propSheet: 'property-sheet',
  item: 'property-item',
  textinput: 'textinput',
  focus: 'focus',
  name: 'name',
  value: 'value',
  wrap: 'wrap',
  group: 'prop-group',
  header: 'prop-group-header'
};

export interface Props {
  items?: Array<PropItemGroup>;
  width?: number;
  model?: PropertySheetModel;
  readOnly?: boolean;
}

interface State {
  model: PropertySheetModel;
  action?: boolean;
  edit?: boolean;
  levelPadding?: number;
}

export class PropertySheet extends React.Component<Props, State> {
  private ref = React.createRef<HTMLDivElement>();

  constructor(props: Props) {
    super(props);

    const model = props.model || new PropertySheetModel();
    props.items && model.setItems(props.items);
    this.state = { model, levelPadding: 3 };
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

  isReadOnly(): boolean {
    if (this.props.readOnly != null)
      return this.props.readOnly == true;

    return this.state.model.isReadOnly();
  }

  renderItemValue(item: PropertyItem<any>): JSX.Element | string {
    if (item.render)
      return item.render(item);

    if (typeof item.value == 'boolean')
      return item.value ? 'true' : 'false';

    return item.value;
  }

  renderEditor(item: PropertyItem<any>, idx: number): JSX.Element {
    const isNum = typeof item.value == 'number';
    const isBool = typeof item.value == 'boolean';
    if (isBool) {
      return (
        <div
          key={idx}
          className={classes.wrap}
          style={{border: '1px solid transparent'}}
          onClick={() => {
            if (item.setValue)
              item.setValue(!item.value);
            else
              item.value = !item.value;
          }}
        >
          {this.renderItemValue(item)}
        </div>
      );
    }

    if (item.items) {
      return (
        <div className={classes.wrap} style={{padding: 0}}>
          <DropDownList
            autoFocus
            autoOpen
            select={item.value}
            items={item.items}
            onSelect={selItem => {
              if (item.setValue)
                item.setValue(selItem[0].data);
              else
                item.value = selItem[0].data;
              this.setState({});
            }}
          />
        </div>
      );
    }

    return (
      <React.Fragment>
        <input
          autoFocus
          key={idx}
          type={isNum && 'number' || null}
          defaultValue={item.value}
          onBlur={e => {
            let value: number | string = e.currentTarget.value;
            if (isNum)
              value = +value;

            if (item.setValue)
              item.setValue(value);
            else
              item.value = value;
            this.setState({ edit: false });
            this.state.model.delayedNotify();
          }}
          onKeyDown={e => {
            let value: string | number = e.currentTarget.value;
            if (isNum)
              value = +value;

            if (e.keyCode == KeyCode.ENTER) {
              if (item.setValue)
                item.setValue(value);
              else
                item.value = value;
            } else if (e.keyCode != KeyCode.ESCAPE)
              return;

            this.ref.current.focus();
            this.setState({ edit: false });
            this.state.model.delayedNotify();
          }}
        />
      </React.Fragment>
    );
  }

  onAction(item: PropertyItem): void {
    this.setState({ action: true });

    item.action(item)
    .then(value => {
      this.ref.current.focus();
      if (item.setValue)
        item.setValue(value);
      else
        item.value = value;
      this.setState({ action: false });
      this.state.model.delayedNotify();
    })
    .catch(() => {
      this.ref.current.focus();
      this.setState({ action: false });
      this.state.model.delayedNotify();
    });
  }

  renderItem(item: PropertyItem, idx: number, depth: number): JSX.Element {
    const model = this.state.model;
    const focusItem = model.getFocusItem() == item ? item : null;
    const ctrlFocus = findParent(document.activeElement as HTMLElement, this.ref.current);
    const editable: boolean = !this.isReadOnly() && item.readOnly != true && focusItem && ctrlFocus && this.state.edit;

    const size = model.getNameColSize();
    const textinput = editable && !item.action;
    return (
      <div
        className={cn(classes.item, focusItem && classes.focus, textinput && classes.textinput)}
        title={'' + item.name}
        onClick={() => {
          model.setFocusItem(item);
          this.setState({ edit: true });
        }}
        key={idx}
      >
        <div
          className={classes.name}
          style={{ width: size < 1 ? null : size, paddingLeft: depth * this.state.levelPadding }}
        >
          <div className={classes.wrap}>{item.name}</div>
        </div>
        <div className={classes.value} title={!Array.isArray(item.value) && '' + item.value}>
          {textinput ? this.renderEditor(item, idx) : <div className={classes.wrap}>{this.renderItemValue(item)}</div>}
          {editable && item.action ? <button onClick={() => this.onAction(item)}>...</button> : null}
        </div>
      </div>
    );
  }

  renderGroup(group: PropItemGroup, idx: number, depth: number) {
    depth++;
    const renderGroup = group.render || ((group: PropItemGroup) => {
      return (
        group.items.map((item, itemIdx: number) => {
          const itemGroup = item as PropItemGroup;
          if (itemGroup.group)
            return this.renderGroup(itemGroup, itemIdx, depth);

          return this.renderItem(item as PropertyItem, itemIdx, depth);
        })
      );
    });

    return (
      <div
        className={classes.group}
        key={idx}
        onScroll={() => {
          if (this.state.edit)
            this.setState({ edit: false });
        }}>
        <div
          className={classes.header}
          onClick={() => {
            this.state.model.setFocusItem(null);
            this.state.model.toggleGroup(group);
          }}
        >
          <div className={classes.wrap} style={{ paddingLeft: depth * this.state.levelPadding }}>
            {group.group}
          </div>
          <i className={group.open != false ? 'fa fa-angle-down' : 'fa fa-angle-right'}/>
        </div>
        <div
          className={classes.wrap}
          style={{
            display: group.open == false ? 'none' : null,
            maxHeight: group.maxHeight
          }}
        >
          {renderGroup(group)}
        </div>
      </div>
    );
  }

  render() {
    const model = this.state.model;
    return (
      <div
        ref={this.ref}
        className={classes.propSheet}
        style={{width: this.props.width}}
        tabIndex={0}
        onKeyDown={e => {
          if (this.state.edit)
            return;

          if (e.keyCode == KeyCode.ENTER)
            this.setState({edit: true});
        }}
        onBlur={e => {
          if (findParent(e.relatedTarget as HTMLElement, this.ref.current))
            return;

          this.setState({});
        }}
      >
        {model.getItems().map((group, idx) => this.renderGroup(group, idx, 1))}
      </div>
    );
  }
}
