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

  static render(...args: Array<string>): JSX.Element | undefined {
    return global.render(...args);
  }

  render(...args: Array<string>): JSX.Element | undefined {
    for (let n = 0; n < args.length; n++) {
      let icon = this.map[args[n]];
      if (!icon)
        continue;

      if (typeof icon == 'function')
        return icon();

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
