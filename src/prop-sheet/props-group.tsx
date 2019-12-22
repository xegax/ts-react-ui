import * as React from 'react';
import { Props as ItemProps } from './prop-item';
import { css } from './classes';
import { className as cn } from '../common/common';
import { HorizontalResizer } from '../resizer';

export interface Props {
  disabled?: boolean;
  label: string;
  icon?: JSX.Element;
  depth?: number;
  key?: number | string;
  itemWrap?: boolean;
  className?: string;

  defaultOpen?: boolean;
  open?: boolean;
  levelPadding?: number;
  defaultHeight?: number;
  maxHeight?: number;
  height?: number;
  width?: number;
  padding?: boolean;
  scrollbars?: boolean;
  flex?: boolean;
  resize?: boolean;
  grow?: boolean;

  onDragEnter?(e: React.DragEvent): void;
  onDragLeave?(e: React.DragEvent): void;
  onDragOver?(e: React.DragEvent): void;
  onDrop?(e: React.DragEvent): void;
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

  renderChildren(children: Array<React.ReactElement<any>>) {
    if (!this.props.flex)
      return children;

    return (
      <div className='vert-panel-1 flexcol flexgrow1'>
        {children}
      </div>
    );
  }

  render() {
    const depth = (this.props.depth || 0) + 1;
    const isOpen = this.isOpen();

    let children = React.Children.toArray(this.props.children) as Array<React.ReactElement<any>>;

    children = children.filter((item: React.ReactElement<ItemProps>) => {
      return item.props.show != false;
    }).map(item => {
      // let height = this.state.height || this.props.height || this.props.defaultHeight;

      return (
        React.cloneElement(item, {
          disabled: item.props.disabled || this.props.disabled,
          // height,
          border: 'border' in item.props ? item.props['border'] : false
        })
      );
    });

    return (
      <div
        className={cn(css.group, this.props.className, this.props.grow && css.grow)}
        onDragEnter={this.props.onDragEnter}
        onDragLeave={this.props.onDragLeave}
        onDrop={this.props.onDrop}
        onDragOver={this.props.onDragOver}
      >
        <div
          className={css.header}
          onClick={e => {
            this.toggleGroup();
          }}
        >
          <div
            className={cn(css.wrap, 'horz-panel-1')}
            style={{
              paddingLeft: depth * (this.props.levelPadding || 5)
            }}
          >
            {this.props.icon ? <span onClick={e => e.stopPropagation()}>{this.props.icon}</span> : null}
            <span>{this.props.label}</span>
          </div>
          <i className={cn(isOpen ? 'fa fa-angle-down' : 'fa fa-angle-right', 'arrow')} />
        </div>
        <div
          ref={this.ref}
          className={cn(css.wrap, this.props.itemWrap != false && css.itemWrap)}
          style={{
            padding: this.props.padding == false ? 0 : undefined,
            display: !isOpen ? 'none' : null,
            maxHeight: this.props.maxHeight,
            height: this.props.height || this.state.height || this.props.defaultHeight,
            overflow: this.props.scrollbars == false ? 'hidden' : undefined
          }}
        >
          {this.renderChildren(children)}
        </div>
        {this.props.resize && <HorizontalResizer
          style={{ display: !isOpen ? 'none' : null }}
          size={() => this.getSize()}
          onResizing={newSize => {
            this.setState({ height: newSize });
          }}
          onDoubleClick={() => {
            this.setState({ height: null });
          }}
        />}
      </div>
    );
  }
}
