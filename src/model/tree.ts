import { Publisher } from 'objio/common/publisher';
import { RenderListModel, RenderArgs } from './list';

export type EventType = 'select';

export interface TreeCtrlData {
  level: number;
  rowIdx: number;
  nextParentIdx: number;
}

export interface TreeItem {
  label: string | JSX.Element;
  open?: boolean;
  itemWrap?(item: JSX.Element): JSX.Element;

  faIcon?: string;
  imgIcon?: string;
  children?: Array<TreeItem>;
  getChildren?(): Promise<Array<TreeItem>>;

  ctrlData?: TreeCtrlData;  //  Tree will store his data here
}

export interface TreeModelHandler {
  renderItem(item: TreeItem): JSX.Element;
}

export class TreeModel<T extends TreeItem = TreeItem> extends Publisher<EventType> {
  private render = new RenderListModel(0, 20);
  private rows = Array<TreeItem>();
  private items: Array<TreeItem>;
  private handler: TreeModelHandler;
  private select: T;

  setHandler(handler: TreeModelHandler): void {
    this.handler = handler;
    this.render.setHandler({
      loadItems: (from: number, count: number): Array<TreeItem> => {
        return this.rows.slice(from, count);
      }
    });
    this.render.setColumns([
      {
        name: 'treeItem',
        render: (args: RenderArgs<TreeItem>) => {
          return this.handler.renderItem(args.item);
        }
      }
    ]);
    this.render.setHeader(false);

    this.render.subscribe(() => {
      this.notify('select');
    }, 'select-row');
  }

  private walkTree(item: TreeItem, level: number) {
    item.ctrlData = item.ctrlData || { level: 0, rowIdx: 0, nextParentIdx: -1 };
    item.ctrlData = { ...item.ctrlData, level, rowIdx: this.rows.length, nextParentIdx: -1 };
    this.rows.push(item);

    const items = item.children || [];
    if (item.open) {
      items.forEach(child => {
        this.walkTree(child, level + 1);
      });
    }
    item.ctrlData.nextParentIdx = this.rows.length;
  }

  getSelect(): T {
    return this.select;
  }

  setSelect(item: T): void {
    if (this.select == item)
      return;

    this.select = item;
    this.render.setSelRow( item.ctrlData.rowIdx );
    this.render.delayedNotify();
    this.delayedNotify();
  }

  findItem(pred: (item: T) => boolean): T {
    return this.items.find(pred) as T;
  }

  rebuildTree() {
    this.rows = [];
    this.items.forEach(child => this.walkTree(child, 0));
    this.render.setItemsCount(this.rows.length);
    this.render.clearCache();
  }

  setItems<T>(items: Array<TreeItem & T>): void {
    this.items = items;
    this.rebuildTree();
  }

  isOpenable(item: TreeItem): boolean {
    return item.children != null;
  }

  getRender(): RenderListModel {
    return this.render;
  }
}
