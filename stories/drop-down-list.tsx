import * as React from 'react';
import { storiesOf } from '@storybook/react';
import { DropDownList, List2Item } from '../src/drop-down-list';
import { DropDownListModel } from '../src/model/drop-down-list';

type Item =  List2Item<{}>;

function render(item: Item, idx: number): JSX.Element {
  return (
    <div key={idx} style={{display: 'inline-block'}}>
      {item.label}
    </div>
  );
}

let revers = false;
let total = 1400;
function loadNext(from: number, count: number): Promise< Array<Item> > {
  let arr: Array<Item> = [];
  count = Math.min(from + count, total) - from;
  while(arr.length < count) {
    let idx = from + arr.length;
    if (revers)
      idx = total - idx - 1;
    arr.push({ label: 'item-' + idx, data: {}, id: '' + idx });
  }

  return Promise.resolve(arr);
}

const items = [
  { label: <span style={{color: 'red'}}>fruit apple</span> },
  { label: 'vegetable onion' },
  { label: 'fruit pear' },
  { label: 'vegetable cabbage'}
];

const items2 = [
  'fruit apple',
  'vegetable onion',
  'fruit pear',
  'vegetable cabbage'
];

let fruits = new DropDownListModel<{label: string}>();
let fruits2 = new DropDownListModel<{label: string}>();
storiesOf('drop-down-list', module)
  .add('drop-down-list', () => {
    return (
      <div style={{
          position: 'absolute',
          left: 0, top: 0, right: 0, bottom: 0,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{padding: 5}}>
          <DropDownList
            items={items2}
            width={120}
            model={fruits}
            onSelect={() => {
              const items = fruits.getSelectedItems();
              if (items.length)
                fruits2.setSelect({ id: items[0].id });
            }}
          />
          <DropDownList
            model={fruits2}
            render={render}
            items={items}
            width={100}
          />
        </div>
        <DropDownList render={render} items={loadNext}/>
      </div>
    );
  });
