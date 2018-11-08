export type ItemType = 'string' | 'number';

export interface PropertyItem {
  name: string;
  type?: ItemType;
  value: string;
  readOnly?: boolean;
  render?(item: PropertyItem): JSX.Element | string;
  setValue?(newValue: string);
  action?(item: PropertyItem): Promise<string>;
}

export interface PropItemGroup {
  group: string;
  open?: boolean;
  maxHeight?: number;
  items?: Array<PropertyItem | PropItemGroup>;
  render?(group: PropItemGroup): JSX.Element;
}

export type PropItemList = Array<PropertyItem>;
