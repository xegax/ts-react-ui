export type ItemType = 'string' | 'number';

export interface PropertyItem<T = string> {
  name: string;
  type?: ItemType;
  value: T;
  items?: Array<T>;
  readOnly?: boolean;
  render?(item: PropertyItem): JSX.Element | T;
  setValue?(v: T);
  action?(item: PropertyItem): Promise<T>;
}

export interface PropItemGroup {
  group: string;
  open?: boolean;
  maxHeight?: number;
  items?: Array<PropertyItem<any> | PropItemGroup>;
  render?(group: PropItemGroup): JSX.Element;
}

export type PropItemList = Array<PropertyItem>;
