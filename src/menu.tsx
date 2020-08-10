import * as React from 'react';
import { Menu, MenuItem, ContextMenu } from './blueprint';

export interface IMenuItem {
  icon?: JSX.Element;
  disabled?: boolean;
  name: string;
  cmd(item: IMenuItem): void;
}

export interface ISubmenuItem {
  name: string;
  submenu: Array<IMenuItem | ISubmenuItem>;
}

export function renderMenuItem(item: IMenuItem | ISubmenuItem, i?: number): JSX.Element {
  if ('submenu' in item) {
    return (
      <MenuItem
        text={item.name}
        key={i}
      >
        {item.submenu.map(renderMenuItem)}
      </MenuItem>
    );
  }
  
  return (
    <MenuItem
      key={i}
      text={item.name}
      onClick={() => item.cmd(item)}
      disabled={item.disabled}
    />
  );
}

export function renderMenu(items: Array<IMenuItem | ISubmenuItem>) {
  return (
    <Menu>
      {items.map(renderMenuItem)}
    </Menu>
  );
}

export interface Pos {
  left: number;
  top: number;
}

export function showMenu(pos: Pos, items: Array<IMenuItem | ISubmenuItem>) {
  ContextMenu.show(renderMenu(items), pos);
}

export function hideMenu() {
  ContextMenu.hide();
}
