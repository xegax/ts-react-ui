import * as React from 'react';
import { DropDown } from '../drop-down';
import { Props as ItemProps } from './prop-item';
import { classes } from './classes';
import { className as cn } from '../common/common';
import { HorizontalResizer } from '../resizer';

export interface Props {
  disabled?: boolean;
  label: string;
  faIcon?: string;
  depth?: number;
  key?: number | string;
  itemWrap?: boolean;
  className?: string;

  defaultOpen?: boolean;
  open?: boolean;
  levelPadding?: number;
  defaultHeight?: number;
  height?: number;
  width?: number;
  padding?: boolean;

  onDragEnter?(e: React.DragEvent);
  onDragLeave?(e: React.DragEvent);
  onDragOver?(e: React.DragEvent);
  onDrop?(e: React.DragEvent);
}

interface State {
  open?: boolean;
  height?: number;
}

export class PropsGroup extends React.Component<Props, State> {
  state: Readonly<State> = {};
  ref = React.createRef<HTMLDivElement>();
  
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

  getSize(): number {
    if (!this.state.height && this.ref.current)
      return this.ref.current.offsetHeight;
    return this.state.height || this.props.height;
  }

  render() {
    const depth = (this.props.depth || 0) + 1;
    const isOpen = this.isOpen();

    let children = React.Children.toArray(this.props.children) as Array<React.ReactElement<any>>;

    children = children.filter((item: React.ReactElement<ItemProps>) => {
      return item.props.show != false;
    }).map(item => {
      return (
        React.cloneElement(item, {
          disabled: this.props.disabled,
          height: this.state.height || this.props.height,
          border: false
        })
      );
    });

    return (
      <div
        className = {cn(classes.group, this.props.className)}
        onDragEnter={this.props.onDragEnter}
        onDragLeave={this.props.onDragLeave}
        onDrop={this.props.onDrop}
        onDragOver={this.props.onDragOver}
      >
        <div
          className = {classes.header}
          onClick = {() => {
            this.toggleGroup();
          }}
        >
          <div className = {classes.wrap} style = {{ paddingLeft: depth * (this.props.levelPadding || 5) }}>
            {this.props.faIcon && <i className={this.props.faIcon}/>}
            {this.props.label}
          </div>
          <i className = {isOpen ? 'fa fa-angle-down' : 'fa fa-angle-right'}/>
        </div>
        <div
          ref={this.ref}
          className = {cn(classes.wrap, this.props.itemWrap != false && classes.itemWrap)}
          style={{
            display: !isOpen ? 'none' : null,
            height: this.props.height || this.state.height || this.props.defaultHeight
          }}
          onScroll = {e => {
            const active = DropDown.getActive();
            if (active && !active.isListView(e.target as HTMLDivElement))
              active.hideList();
          }}
        >
          {children}
        </div>
        <HorizontalResizer
          style={{display: !isOpen ? 'none' : null}}
          width={this.props.width}
          size={() => this.getSize()}
          onResize={newSize => {
            const active = DropDown.getActive();
            active && active.hideList();
            this.setState({height: newSize});
          }}
        />
      </div>
    );
  }
}
