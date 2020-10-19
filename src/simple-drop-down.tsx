import * as React from 'react';
import { Popover } from './popover';
import { ListView, Item, renderItem } from './list-view2';
import { Classes } from './blueprint';
import { cn } from './common/common';

export const css = {
  dropDown: 'simple-drop-down',
  dropDownBox: 'simple-drop-down-box',
  border: 'simple-drop-down-border'
};

interface Props {
  values: Array<Item>;
  value?: Item;
  onSelect(value: Item): void;
  width?: number | string;
  className?: string;
}

export const SimpleDropDown: React.SFC<Props> = props => {
  const selItem = props.values.find(item => item.value == props.value.value);
  return (
    <div className={cn(css.dropDown, 'popover-wrapper-flex')}>
      <Popover>
        <div
          className={cn(css.dropDownBox, props.className)}
          style={{
            width: props.width,
          }}
        >
          {renderItem(selItem)}
        </div>
        <ListView
          values={props.values}
          value={selItem ? [selItem] : undefined}
          className={Classes.POPOVER_DISMISS}
          onSelect={v => {
            props?.onSelect(v[0]);
          }}
        />
      </Popover>
    </div>
  );
};

export const Control = SimpleDropDown;
