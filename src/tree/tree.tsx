import * as React from 'react';
import { ListView } from '../list-view2';
import { render } from '../react-common';
import { CSSIcon } from '../cssicon';
import { TreeItem, TreeItemHolder, TreeModel, ValuePath, HolderPath, ItemPath } from './tree-model';
import { FitToParent } from '../fittoparent';
import * as folderSVG from '../icons/svg/folder.svg';
import { IconSVG, IconSize } from '../icon-svg';
import { Draggable, Droppable, DropArgs } from '../drag-and-drop';
import { KeyCode } from '../common/keycode';
import { cn } from '../common/common';

export { TreeItem };

export interface DragAndDrop {
  drag: Array<TreeItem>;
  dragParent: Array<TreeItem>;
  drop: TreeItem;
  dropParent?: TreeItem;
};

// select is path to specific item in hierarchy
interface Props {
  values: Array<TreeItem>;

  defaultSelect?: Array<ValuePath>;
  select?: Array<ValuePath>;
  multiselect?: boolean;

  onOpen?(item: TreeItem): void;
  onClose?(item: TreeItem): void;
  onSelect?(path: Array<ItemPath>): void;
  onDragAndDrop?(args: DragAndDrop): void;
  hideIcons?: boolean;
  defaultIcon?: JSX.Element;
  defaultIconSize?: IconSize;
  style?: React.CSSProperties;
}

interface State {
  model: TreeModel;
  hover?: TreeItemHolder;
}

function findParent(start: TreeItemHolder, parent: TreeItemHolder) {
  while (start) {
    if (start.item == parent.item)
      return true;
    start = start.parent;
  }

  return false;
}

export class Tree extends React.Component<Props, State> {
  static defaultProps: Partial<Props> = {};
  private dragging = Array<TreeItemHolder>();
  private drop: TreeItemHolder;
  private ref = React.createRef<ListView>();

  constructor(props: Props) {
    super(props);

    const model = new TreeModel({
      renderTreeItem: this.renderTreeItem
    });
    this.state = { model };

    if (props.defaultSelect) {
      model.setValues(props.values);
      model.setSelect(props.defaultSelect);
    }
  }

  static onDragAndDrop(args: DragAndDrop) {
    if (!Array.isArray(args.drop.children) && args.dropParent && !Array.isArray(args.dropParent.children))
      return;

    const dst = (args.drop.childrenCache || args.drop.children || args.dropParent.children) as Array<TreeItem>;
    if (!Array.isArray(dst))
      return;

    args.dragParent.forEach((parent, i) => {
      const children = parent.childrenCache || parent.children;
      if (!Array.isArray(children))
        return;

      const n = children.indexOf(args.drag[i]);
      if (n == -1)
        return;

      children.splice(n, 1);
      dst.push(args.drag[i]);
    });
  }

  subscriber = () => {
    this.setState({});
  };

  onScroll = () => {
    this.ref.current && this.ref.current.scrollToFocus();
  };

  componentDidMount() {
    this.state.model.subscribe(this.subscriber);
    this.state.model.subscribe(this.onScroll, 'scroll');
  }

  componentWillUnmount() {
    this.state.model.unsubscribe(this.subscriber);
    this.state.model.unsubscribe(this.onScroll, 'scroll');
  }

  static getDerivedStateFromProps(p: Props, s: State) {
    s.model.setValues(p.values);
    s.model.setSelect(p.select);
  }

  private onDragHover = (args: DropArgs<TreeItem, TreeItem>) => {
    if (this.drop && this.drop.item == args.dropData)
      return;

    this.drop = this.state.model.getHolders().find(h => h.item == args.dropData);
    if (!this.drop)
      return;

    if (!this.dragging.length) {
      this.dragging = this.state.model.getSelectHolders();
      if (!this.dragging.some(h => h.item == args.dragData)) {
        this.dragging = [ this.state.model.getHolders().find(h => h.item == args.dragData) ]; // draging non selected holder
      }
    }

    const sameParent = !this.dragging.some(h => h.parent != this.dragging[0].parent);
    const dragToSelf = this.dragging.some(h => args.dropData == h);
    const dragToSelfParent = (this.dragging.length == 1 || sameParent) && this.dragging.some(h => h.parent && h.parent.item == args.dropData);
    const noChildren = !args.dropData.children;
    if (dragToSelf || dragToSelfParent || noChildren || this.dragging.some(drag => findParent(this.drop, drag)))
      this.setState({ hover: null });
    else
      this.setState({ hover: this.drop });
  };

  private onDrop = () => {
    const hover = this.state.hover;
    if (!hover)
      return;

    this.onDragStop();

    const selectItems = this.dragging.map(h => h.item);
    this.props.onDragAndDrop({
      drag: selectItems,
      dragParent: this.dragging.map(h => h.parent.item),
      dropParent: hover.parent ? hover.parent.item : undefined,
      drop: hover.item
    });
    this.state.model.updateHolders(new Set(selectItems));
    this.props.onSelect && this.props.onSelect(
      this.state.model.getSelectHolders().map(h => this.state.model.getPathByHolder(h))
    );
  };

  private onDragStart = () => {
    this.dragging = [];
    this.drop = null;
  };

  private onDragStop = () => {
    this.setState({ hover: null });
    this.drop = null;
  };

  wrapRow = (jsx: JSX.Element, holder: TreeItemHolder): JSX.Element => {
    if (!this.props.onDragAndDrop)
      return jsx;

    jsx = (
      <Draggable
        data={holder.item}
        enabled={holder.item.draggable}
        onDragStart={this.onDragStart}
      >
        {jsx}
      </Draggable>
    );

    if (holder.item.droppable !== false) {
      jsx = (
        <Droppable
          dropData={holder.item}
          onDragEnter={this.onDragHover}
          onDragOver={this.onDragHover}
          onDragLeave={this.onDragStop}
          onDrop={this.onDrop}
        >
          {jsx}
        </Droppable>
      );
    }

    return jsx;
  };

  wrap = (jsx: JSX.Element, holder: TreeItemHolder): JSX.Element => {
    /*if (!item.onDropTo && !this.props.onDragAndDrop) {
      return <Droppable>{jsx}</Droppable>;
    }*/

    return jsx;
  };

  renderTreeItem = (holder: TreeItemHolder) => {
    const m = this.state.model;
    const folder = m.isFolder(holder);
    const defultIcon = this.props.defaultIcon || (
      <IconSVG
        icon={folderSVG}
        size={this.props.defaultIconSize}
      />
    );

    let icon = 'fa fa-angle-right';
    if (m.isOpened(holder))
      icon = 'fa fa-angle-down';

    if (holder.loading)
      icon = 'fa fa-spinner fa-spin';

    const jsx = (
      <div className={cn('tree-ctrl-item-wrapper', this.state.hover == holder && 'drop-hover')}>
        <div className={cn('horz-panel-1', 'tree-ctrl-item')} style={{ marginLeft: holder.level * 5 }}>
          <CSSIcon
            width='1em'
            hidden={!folder}
            icon={icon}
            onClick={e => {
              e.stopPropagation();
              if (m.isOpened(holder)) {
                m.close(holder);
                this.props.onClose && this.props.onClose(holder.item);
              } else {
                m.open(holder);
                this.props.onOpen && this.props.onOpen(holder.item);
              }
            }}
          />
          {!this.props.hideIcons && ( holder.item.icon || defultIcon)}
          <div className='tree-ctrl-item-label'>
            {render(holder.item.render, holder.item) || holder.item.value}
          </div>
        </div>
        <div className={cn('horz-panel-1', 'tree-ctrl-item-right-icons')}>
          {holder.item.rightIcons}
        </div>
      </div>
    );

    return this.wrapRow(jsx, holder);
  }
  
  render() {
    const values = this.state.model.getHolders();
    return (
      <div style={{ position: 'relative', overflow: 'hidden', ...this.props.style }}>
        <div style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
          <FitToParent>
            <ListView
              ref={this.ref}
              className='tree-ctrl'
              multiselect={this.props.multiselect}
              border={false}
              value={this.state.model.getSelectHolders()}
              values={values}
              onKeyDown={args => {
                const h = args.focusItem as TreeItemHolder;
                if (args.event.keyCode == KeyCode.ENTER) {
                  if (!h.item.open)
                    this.state.model.open(h);
                  else
                    this.state.model.close(h);
                }
              }}
              onSelect={(rows: Array<TreeItemHolder>) => {
                const select = rows.map(h => this.state.model.getPathByHolder(h));
                this.props.onSelect && this.props.onSelect(select);
              }}
            />
          </FitToParent>
        </div>
      </div>
    );
  }
}
