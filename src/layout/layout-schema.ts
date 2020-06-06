export interface LayoutSchema {
  root: SchemaContainer;
}

export type SchemaItem = SchemaElement | SchemaContainer;

export interface SchemaSize {
  width?: number;
  height?: number;
  
  minWidth?: number;
  minHeight?: number;

  maxWidth?: number;
  maxHeight?: number;
}

export interface SchemaElement extends SchemaSize {
  key: string;
  grow: number;
}

export type ContainerType = 'row' | 'column';

export interface SchemaContainer extends SchemaSize {
  key?: string;
  grow: number;

  type: ContainerType;
  items: Array<SchemaItem>;
};

export function isSchemaElement(item?: SchemaItem): { el?: SchemaElement, cont?: SchemaContainer } {
  if (!item)
    return {};

  if ('type' in item)
    return { cont: item };

  return { el: item };
}

export function findItem(item: SchemaItem, f: (item: SchemaItem, cont: SchemaContainer) => boolean, itemCont?: SchemaContainer): { item: SchemaItem, cont: SchemaContainer } | undefined {
  if (f(item, itemCont))
    return { item, cont: itemCont };

  const { cont, el } = isSchemaElement(item);
  if (el)
    return undefined;

  for (let n = 0; n < cont.items.length; n++) {
    const res = findItem(cont.items[n], f, cont);
    if (res)
      return res;
  }

  return undefined;
}

export function findItemByKey(root: SchemaItem, key: string) {
  return findItem(root, item => item.key == key);
}
