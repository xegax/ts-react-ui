import * as React from 'react';
import { DropDown } from '../drop-down';
import { Props as ItemProps, PropItem } from './prop-item';
import { classes } from './classes';
import { className as cn } from '../common/common';

export interface Props {
  disabled?: boolean;
  label: string;
  depth?: number;
  key?: number | string;

  defaultOpen?: boolean;
  open?: boolean;
  levelPadding?: number;
  height?: number;
}

interface State {
  open?: boolean;
}

export class PropsGroup extends React.Component<Props, State> {
  state: Readonly<State> = {};
  
  constructor(props: Props) {
    super(props);

    this.state = {
      open: props.defaultOpen == null ? true : false
    };
  }

  isOpen(): boolean {
    return this.props.open != null ? this.props.open : this.state.open;
  }

  toggleGroup() {
    this.setState({ open: !this.state.open });
  }

  render() {
    const depth = (this.props.depth || 0) + 1;
    const isOpen = this.isOpen();

    let children = React.Children.toArray(this.props.children) as Array<React.ReactElement<any>>;
    const propItems = children.some(item => item.type == PropItem);
    children = children.filter((item: React.ReactElement<ItemProps>) => {
      return item.props.show != false;
    }).map(item => {
      if (this.props.disabled)
        item = React.cloneElement(item, { disabled: true });
      return item;
    });

    return (
      <div className = {classes.group}>
        <div
          className = {classes.header}
          onClick = {() => {
            this.toggleGroup();
          }}
        >
          <div className = {classes.wrap} style = {{ paddingLeft: depth * (this.props.levelPadding || 5) }}>
            {this.props.label}
          </div>
          <i className = {isOpen ? 'fa fa-angle-down' : 'fa fa-angle-right'}/>
        </div>
        <div
          className = {cn(classes.wrap, propItems && classes.itemWrap)}
          style={{
            display: !isOpen ? 'none' : null,
            maxHeight: this.props.height
          }}
          onScroll = {() => {
            const active = DropDown.getActive();
            active && active.hideList();
          }}
        >
          {children}
        </div>
      </div>
    );
  }
}