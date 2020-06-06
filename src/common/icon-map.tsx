import * as React from 'react';

export type IconEntry = JSX.Element | (() => JSX.Element);
export type IconMapObj = {[id: string]: IconEntry};

let global: IconMap;

export class IconMap {
  private map: IconMapObj = {};

  constructor(map?: IconMapObj) {
    this.map = map || this.map;
  }

  static get(): IconMap {
    return global;
  }

  static render<T = React.Props<any>>(icon: string | string[], p?: T): JSX.Element | undefined {
    return global.render(icon, p);
  }

  render<T = React.Props<any>>(icon: string | string[], p?: T): JSX.Element | undefined {
    const iconsArr = Array.isArray(icon) ? icon : [icon];
    for (let n = 0; n < iconsArr.length; n++) {
      let icon = this.map[iconsArr[n]];
      if (!icon)
        continue;

      if (typeof icon == 'function')
        return icon();

      if (p)
        icon = React.cloneElement(icon, p);

      return icon;
    }
  }

  replace(map: IconMapObj) {
    Object.keys(map)
    .forEach(key => {
      this.map[key] = map[key];
    });
  }

  append(map: IconMapObj) {
    Object.keys(map)
    .forEach(key => {
      if (this.map[key])
        throw `Icon id=${key} already exists in IconMap`;

      this.map[key] = map[key];
    });
  }
}

global = new IconMap();
