export type ItemType = 'string' | 'number';

export interface PropertyItem<T = string> {
  name: string;
  type?: ItemType;
  value: T | (() => T);
  items?: Array<T>;
  readOnly?: boolean;
  show?: boolean;
  doubleRow?: boolean;
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
export function getValue<T = any>(prop: PropertyItem<any>): T {
  return typeof prop.value == 'function' ? prop.value() : prop.value;
}
