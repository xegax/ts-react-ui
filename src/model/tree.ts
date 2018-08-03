import { Publisher } from '../common/publisher';
import { RenderListModel } from './list';

export type EventType = 'select';

interface TreeCtrlData {
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

  setHandler(handler: TreeModelHandler): void {
    this.handler = handler;
    this.render.setHandler({
      loadItems: (from: number, count: number): Array<JSX.Element> => {
        const items = this.rows.slice(from, count);
        const jsx = items.map(item => {
          return this.handler.renderItem(item);
        });

        return jsx;
      }
    });

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
    return this.rows[this.render.getSelRow()] as T;
  }

  setSelect(item: T): void {
    this.render.setSelRow(this.rows.indexOf(item));
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
