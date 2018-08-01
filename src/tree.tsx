import * as React from 'react';
import { List, RenderListModel } from './list';
import { Publisher } from './common/publisher';
import { className as cn } from './common/common';
import './_tree.scss';

const classes = {
  open: 'fa fa-minus-square-o',
  close: 'fa fa-plus-square-o',
  tree: 'tree-ctrl',
  item: 'tree-ctrl-item',
  opened: 'tree-ctrl-opened',
  closed: 'tree-ctrl-closed'
};

interface TreeCtrlData {
  level: number;
  rowIdx: number;
  nextParentIdx: number;
  open: boolean;
}

export interface TreeItem {
  label: string;
  children?: Array<TreeItem>;
  getChildren?(): Promise<Array<TreeItem>>;

  ctrlData?: TreeCtrlData;  //  Tree will store his data here
}

export class TreeModel extends Publisher {
  private render = new RenderListModel(0, 20);
  private rows = Array<TreeItem>();
  private items: Array<TreeItem>;

  private walkTree(item: TreeItem, level: number) {
    item.ctrlData = item.ctrlData || { level: 0, rowIdx: 0, nextParentIdx: -1, open: false };
    item.ctrlData = { ...item.ctrlData, level, rowIdx: this.rows.length, nextParentIdx: -1 };
    this.rows.push(item);

    const items = item.children || [];
    if (item.ctrlData.open) {
      items.forEach(child => {
        this.walkTree(child, level + 1);
      });
    }
    item.ctrlData.nextParentIdx = this.rows.length;
  }

  private rebuildTree() {
    this.rows = [];
    this.items.forEach(child => this.walkTree(child, 0));
    this.render.setItemsCount(this.rows.length);
    this.render.clearCache();
  }

  setItems(items: Array<TreeItem>): void {
    this.items = items;
    
    this.render.setHandler({
      loadItems: (from: number, count: number): Array<JSX.Element> => {
        const items = this.rows.slice(from, count);
        const jsx = items.map(item => {
          return this.renderItem(item);
        });

        return jsx;
      }
    });

    this.rebuildTree();
  }

  isOpenable(item: TreeItem): boolean {
    return item.children != null;
  }

  renderItem(item: TreeItem): JSX.Element {
    const levelOffs = 10;
    const className = cn(
      classes.item,
      this.isOpenable(item) ? item.ctrlData.open && classes.opened || classes.closed : false
    );
    return (
      <div
        className={className}
        style={{ marginLeft: item.ctrlData.level * levelOffs, cursor: item.children ? 'pointer' : 'default' }}
        onClick={() => {
          if (!item.children)
            return;

          item.ctrlData.open = !item.ctrlData.open;
          this.rebuildTree();
          this.render.clearCache(true);
          this.render.notify();
        }}
      >
        {this.isOpenable(item) ?
          <i className={cn(item.ctrlData.open && classes.open || classes.close)}/> : null }
        {item.label}
      </div>
    );
  }

  getRender(): RenderListModel {
    return this.render;
  }
}

export interface Props {
  model: TreeModel;
  width?: number;
  height?: number;
}

export class Tree extends React.Component<Props, {}> {
  render() {
    return (
      <List
        extraClass={classes.tree}
        width={this.props.width}
        height={this.props.height}
        border={false}
        model={this.props.model.getRender()}
      />
    );
  }
}
