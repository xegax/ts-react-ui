export function findParent(start: HTMLElement, parent: HTMLElement): boolean {
  while (start) {
    if (start == parent)
      return true;
    
    start = start.parentElement;
  }

  return false;
}
