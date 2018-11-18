import * as React from 'react';
import { PropertyItem, getValue } from './property-item';
import { DropDown } from '../drop-down';
import { KeyCode } from '../../common/keycode';
import { Switch } from '@blueprintjs/core';
import { RangeSlider } from '../range-slider';

export interface RenderResult {
  element: JSX.Element;
  inline?: boolean;
};

export type SetValueCallback = (item: PropertyItem<any>, newValue: any) => void;
export interface FactoryItem {
  render(item: PropertyItem, setValue: SetValueCallback): RenderResult;
}

export class ItemFactory {
  private items = Array<FactoryItem>();

  registerItem(item: FactoryItem) {
    this.items.push(item);
  }

  renderItem(item: PropertyItem, setValue: SetValueCallback) {
    let res: RenderResult;
    for (let n = 0; n < this.items.length; n++) {
      if (res = this.items[n].render(item, setValue))
        break;
    }

    return res;
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

        const element = (
          <DropDown
            style = {{ flexGrow: 1 }}
            enabled = {prop.readOnly != true}
            values = {values}
            value = {getValue(prop)}
            onSelect = {item => {
              setValue(prop, item.value);
            }}
          />
        );

        return { element };
      }
    });

    this.registerItem({
      render(prop: PropertyItem, setValue: SetValueCallback) {
        const type = typeof prop.value;
        if (type != 'boolean')
          return null;

        const element = (
          <Switch
            disabled = {prop.readOnly}
            checked = {prop.value as any}
            onChange = {e => {
              setValue(prop, e.currentTarget.checked);
            }}
          />
        );

        return { element, inline: true };
      }
    });

    this.registerItem({
      render(prop: PropertyItem, setValue: SetValueCallback) {
        const type = typeof prop.value;
        if (type != 'string' && type != 'number')
          return null;

        const element = (
          <input
            disabled = {prop.readOnly}
            type = {type}
            defaultValue = {getValue(prop)}
            onBlur = {e => {
              setValue(prop, e.currentTarget.value);
            }}
            onKeyDown = {e => {
              if (e.keyCode == KeyCode.ENTER)
                setValue(prop, e.currentTarget.value);
            }}
          />
        );

        return { element };
      }
    });

    this.registerItem({
      render(prop: PropertyItem<any>, setValue: SetValueCallback) {
        const type = typeof prop.value;
        const value = prop.value as any as { min: number; max: number; value: number };
        if (type != 'object' || value.min == null || value.max == null || value.value == null)
          return null;

        let tmpValue = value.value;
        const element = (
          <RangeSlider
            wrapToFlex
            min={value.min}
            max={value.max}
            range={[ 50, 50 ]}
          />
        );

        return { element };
      }
    });
  }
}