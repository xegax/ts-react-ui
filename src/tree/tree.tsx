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

  subscriber = () => {
    this.setState({});
  };

  componentDidMount() {
    this.state.model.subscribe(this.subscriber);
  }

  componentWillUnmount() {
    this.state.model.unsubscribe(this.subscriber);
  }

  static getDerivedStateFromProps(p: Props, s: State) {
    s.model.setValues(p.values);
    s.model.setSelect(p.select);
  }

  wrapRow = (jsx: JSX.Element, holder: TreeItemHolder): JSX.Element => {
    if (!this.props.onDragAndDrop)
      return jsx;

    const onDragHover = (args: DropArgs<TreeItemHolder, TreeItemHolder>) => {
      const dragToSelf = args.dragData.item == holder.item;
      const dragToSelfParent = args.dragData.parent && args.dragData.parent.item == holder.item;
      const noChildren = !holder.item.children;
      if (dragToSelf || dragToSelfParent || noChildren || findParent(holder, args.dragData))
        this.setState({ hover: null });
      else
        this.setState({ hover: holder });
    };
  
    const onDragStop = () => {
      this.setState({ hover: null });
    };

    jsx = (
      <Draggable
        data={holder}
        enabled={holder.item.draggable}
        onDragStart={() => {
          const items = this.state.model.getSelectHolders().map(v => v.item);
          // this.state.model.b;
          // console.log(this.state.model.getPathByHolder(holder).map(v => v.value));
          /*if (!this.state.model.getSelectHolders().some(h => h.item == holder.item))
            this.state.model.setSelect([ this.state.model.getPathByHolder(holder).map(v => v.value) ]);*/
        }}
      >
        {jsx}
      </Draggable>
    );

    if (holder.item.droppable !== false) {
      jsx = (
        <Droppable
          onDragEnter={onDragHover}
          onDragOver={onDragHover}
          onDragLeave={onDragStop}
          onDrop={(_: DropArgs<TreeItemHolder, TreeItemHolder>) => {
            const hover = this.state.hover;
            if (!hover)
              return;

            onDragStop();
            const selectHolders = this.state.model.getSelectHolders();
            const selectItems = selectHolders.map(h => h.item);
            this.props.onDragAndDrop({
              drag: selectItems,
              dragParent: selectHolders.map(h => h.parent.item),
              dropParent: hover.parent ? hover.parent.item : undefined,
              drop: hover.item 
            });
            this.state.model.updateHolders(new Set(selectItems));
            this.props.onSelect && this.props.onSelect(
              this.state.model.getSelectHolders().map(h => this.state.model.getPathByHolder(h))
            );
          }}
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
      <div style={{ fontWeight: this.state.hover == holder ? 'bold' : undefined }}>
        <div className='horz-panel-1' style={{ marginLeft: holder.level * 5, display: 'inline-flex', alignItems: 'center' }}>
          <CSSIcon
            width='1em'
            hidden={!folder}
            icon={icon}
            onClick={e => {
              e.stopPropagation();
              m.isOpened(holder) ? m.close(holder) : m.open(holder);
            }}
          />
          {!this.props.hideIcons && ( holder.item.icon || defultIcon)}
          <span>
            {render(holder.item.render, holder.item) || holder.item.value}
          </span>
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
