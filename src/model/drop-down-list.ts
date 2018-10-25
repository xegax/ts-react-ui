import { List2Model, List2Item, EventType as List2EventType } from './list2';

export {
  List2Item
};

export type EventType = List2EventType | 'close-list' | 'filter';

export class DropDownListModel<T> extends List2Model<T, EventType> {
  protected filterable = true;
  protected filter: string = '';

  constructor() {
    super();
    this.selectOnFocus = false;
  }


  isFilterable(): boolean {
    return this.filterable;
  }

  setFilterable(filterable: boolean): boolean {
    if (this.filterable == filterable)
      return false;

    this.filterable = filterable;
    this.delayedNotify();
    return true;
  }

  setFilter(filter: string): boolean {
    if (this.filter == filter)
      return false;

    this.filter = filter;
    this.delayedNotify({ type: 'filter' });
    return true;
  }

  getFilter(): string {
    return this.filter;
  }
}
