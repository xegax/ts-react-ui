import * as React from 'react';
import { PropertyItem, PropItemGroup } from './property-item';
import { PropertySheetModel } from './property-sheet-model';
import { className as cn } from '../common/common';
import { findParent } from '../common/dom';
import { DropDown } from '../drop-down';
import { FitToParent } from '../fittoparent';
import { DefaultFactory, ItemFactory } from './item-factory';

export { PropertyItem, PropItemGroup };

const classes = {
  propSheet: 'property-sheet',
  item: 'property-item',
  textinput: 'textinput',
  focus: 'focus',
  name: 'name',
  nameWrap: 'name-wrap',
  value: 'value',
  valueWrap: 'value-wrap',
  wrap: 'wrap',
  group: 'prop-group',
  header: 'prop-group-header'
};

export interface Props {
  items?: Array<PropItemGroup>;
  width?: number;
  model?: PropertySheetModel;
  readOnly?: boolean;
  factory?: ItemFactory;
}

interface State {
  model: PropertySheetModel;
  action?: boolean;
  edit?: boolean;
  levelPadding?: number;
}

function hasClass(e: Element, name: string) {
  return (e.className || '').split(' ').indexOf(name) != -1;
}

function scrollIntoView(e: React.MouseEvent) {
  let parent = e.currentTarget;
  let value: HTMLElement;
  while( parent && !hasClass(parent, classes.group) ) {
    if (!value && parent && hasClass(parent, classes.value))
      value = parent as HTMLElement;
    parent = parent.parentElement;
  }

  if (!parent)
    return;

  let wrap = parent.lastChild as HTMLElement;
  if (wrap.scrollHeight == wrap.clientHeight)
    return;

  const offset = value.getBoundingClientRect().top - wrap.getBoundingClientRect().top;
  if (offset < 0)
    value.scrollIntoView(true);
  else if (offset + value.offsetHeight > wrap.clientHeight)
    value.scrollIntoView(false);
}

export class PropertySheetImpl extends React.Component<Props, State> {
  private ref = React.createRef<HTMLDivElement>();
  private static factory: ItemFactory = new DefaultFactory();
  
  static getFactory(): ItemFactory {
    return this.factory;
  }

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

  setValue = (item: PropertyItem, value: string) => {
    if (item.setValue)
      item.setValue(value);
    else
      item.value = value;

    console.log(value);
    this.setState({});
  }

  renderItemValue(item: PropertyItem): JSX.Element {
    let jsx: JSX.Element;
    if (this.props.factory)
      jsx = this.props.factory.renderItem(item, this.setValue);

    if (!jsx)
      jsx = PropertySheetImpl.factory.renderItem(item, this.setValue);

    return jsx;
  }

  renderItem(item: PropertyItem, idx: number, depth: number): JSX.Element {
    return (
      <div
        className = {cn(classes.item)}
        title = {item.name}
        key = {idx}
      >
        <div className = {classes.name}>
          <div className = {classes.nameWrap} style = {{ paddingLeft: depth * this.state.levelPadding }} >{ item.name }</div>
        </div>
        <div className={ classes.value } title={ item.value } onMouseDown={scrollIntoView}>
          <div className = { classes.valueWrap } style = {{ width: this.props.width / 2}}>
            {this.renderItemValue(item)}
          </div>
        </div>
      </div>
    );
  }

  renderGroup(group: PropItemGroup, idx: number, depth: number) {
    depth++;
    const renderGroup = group.render || ((group: PropItemGroup) => {
      return (
        group.items.filter(item => (item as PropertyItem).show != false).map((item, itemIdx: number) => {
          const itemGroup = item as PropItemGroup;
          if (itemGroup.group)
            return this.renderGroup(itemGroup, itemIdx, depth);

          return this.renderItem(item as PropertyItem, itemIdx, depth);
        })
      );
    });

    return (
      <div
        className = {classes.group}
        key = {idx}
      >
        <div
          className = {classes.header}
          onClick = {() => {
            this.state.model.toggleGroup(group);
          }}
        >
          <div className = {classes.wrap} style = {{ paddingLeft: depth * this.state.levelPadding }}>
            {group.group}
          </div>
          <i className = {group.open != false ? 'fa fa-angle-down' : 'fa fa-angle-right'}/>
        </div>
        <div
          className = {classes.wrap}
          style={{
            display: group.open == false ? 'none' : null,
            maxHeight: group.maxHeight
          }}
          onScroll = {() => {
            const active = DropDown.getActive();
            active && active.hideList();
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

export function PropertySheet(props: Props): JSX.Element {
  return (
    <FitToParent calcH = {false}>
      <PropertySheetImpl {...props}/>
    </FitToParent>
  );
}