import * as React from 'react';
import { PropertyItem } from './property-item';
import { DropDown } from '../drop-down';
import { KeyCode } from '../../common/keycode';
import { Switch } from '@blueprintjs/core';

export type SetValueCallback = (item: PropertyItem, newValue: string | boolean) => void;
export interface FactoryItem {
  render(item: PropertyItem, setValue: SetValueCallback): JSX.Element;
}

export class ItemFactory {
  private items = Array<FactoryItem>();

  registerItem(item: FactoryItem) {
    this.items.push(item);
  }

  renderItem(item: PropertyItem, setValue: SetValueCallback): JSX.Element {
    let jsx: JSX.Element;
    for (let n = 0; n < this.items.length; n++) {
      if (jsx = this.items[n].render(item, setValue))
        break;
    }

    return jsx;
  }
}

export class DefaultFactory extends ItemFactory {
  constructor() {
    super();

    this.registerItem({
      render(prop: PropertyItem, setValue: SetValueCallback) {
        if (!Array.isArray(prop.items))
          return null;

        const values = prop.items.map(value => {
          return { value };
        });

        return (
          <DropDown
            style = {{ flexGrow: 1 }}
            enabled = {prop.readOnly != true}
            values = {values}
            value = {prop.value}
            onSelect = {item => {
              setValue(prop, item.value);
            }}
          />
        );
      }
    });

    this.registerItem({
      render(prop: PropertyItem, setValue: SetValueCallback) {
        const type = typeof prop.value;
        if (type != 'boolean')
          return null;

        return (
          <Switch
            disabled = {prop.readOnly}
            checked = {prop.value as any}
            onChange = {e => {
              setValue(prop, e.currentTarget.checked);
            }}
          />
        );
      }
    });

    this.registerItem({
      render(prop: PropertyItem, setValue: SetValueCallback) {
        const type = typeof prop.value;
        if (type != 'string' && type != 'number')
          return null;

        return (
          <input
            disabled = {prop.readOnly}
            type = {type}
            defaultValue = {prop.value}
            onBlur = {e => {
              setValue(prop, e.currentTarget.value);
            }}
            onKeyDown = {e => {
              if (e.keyCode == KeyCode.ENTER)
                setValue(prop, e.currentTarget.value);
            }}
          />
        );
      }
    });
  }
}