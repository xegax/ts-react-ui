import { Publisher } from 'objio';
import { PropertyItem, PropItemGroup } from './property-item';

export class PropertySheetModel extends Publisher {
  protected nameColSize: number = 0.5;
  protected focusItem: PropertyItem;
  protected items = Array<PropItemGroup>();
  protected readOnly: boolean = false;

  setReadOnly(value: boolean) {
    if (this.readOnly == value)
      return;

    this.readOnly = value;
    this.delayedNotify();
  }

  isReadOnly(): boolean {
    return this.readOnly;
  }

  setItems(items: Array<PropItemGroup>) {
    this.items = items;
    this.delayedNotify();
  }

  getItems(): Array<PropItemGroup> {
    return this.items;
  }

  toggleGroup(group: PropItemGroup) {
    group.open = !(group.open != false);
    this.delayedNotify();
  }

  getNameColSize(): number {
    return this.nameColSize;
  }

  setNameColSize(size: number): void {
    if (size == this.nameColSize)
      return;

    this.nameColSize = size;
    this.delayedNotify();
  }

  getFocusItem(): PropertyItem {
    return this.focusItem;
  }

  setFocusItem(item: PropertyItem): void {
    if (item == this.focusItem)
      return;

    this.focusItem = item;
    this.delayedNotify();
  }
}
