import * as React from 'react';
import { List, RenderListModel } from './list';
import { Publisher } from './common/publisher';

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
      loadItems: (from: number, count: number): Promise<Array<JSX.Element>> => {
        const items = this.rows.slice(from, count);
        const jsx = items.map(item => {
          return this.renderItem(item);
        });

        return Promise.resolve( jsx );
      }
    });

    this.rebuildTree();
  }

  renderItem(item: TreeItem): JSX.Element {
    const levelOffs = 10;
    return (
      <div
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
  componentWillMount() {
  }

  render() {
    return (
      <List
        width={this.props.width}
        height={this.props.height}
        border={false}
        model={this.props.model.getRender()}
      />
    );
  }
}
