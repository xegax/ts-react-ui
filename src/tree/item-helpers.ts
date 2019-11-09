import { TreeItem } from './tree-model';

export { TreeItem };

export function getChildren<T extends TreeItem>(item: T): Array<T> {
  const children = (item.childrenCache || item.children) as Array<T>;
  if (Array.isArray(children))
    return children;

  return [];
}

export function findItem<T extends TreeItem>(func: (item: T) => boolean | void, items: Array<T>): T | undefined {
  items = items.slice();
  for (let n = 0; n < items.length; n++) {
    const folder = items[n]; 
    if (func(folder))
      return folder;
  }

  for (let n = 0; n < items.length; n++) {
    const folder = getChildren(items[n]);
    if (!folder.length)
      continue;

    const r = findItem(func, folder);
    if (r)
      return r;
  }

  return undefined;
}

export function getPath<T extends TreeItem>(item: T): Array<T> {
  let path = Array<T>();
  while (item) {
    path.push(item);
    item = item.parent as T;
  }
  return path.reverse();
}
