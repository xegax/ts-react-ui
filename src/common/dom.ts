export function findParent(start: HTMLElement, parent: HTMLElement): boolean {
  while (start) {
    if (start == parent)
      return true;
    
    start = start.parentElement;
  }

  return false;
}

export function findParentByFunc(start: HTMLElement, func: (parent: HTMLElement) => boolean): HTMLElement {
  while (start) {
    if(func(start))
      return start;

    start = start.parentElement;
  }

  return null;
}