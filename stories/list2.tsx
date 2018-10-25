import * as React from 'react';
import { FitToParent } from '../src/fittoparent';
import { storiesOf } from '@storybook/react';
import { List2, List2Model, List2Item } from '../src/list2';

type Item = List2Item<{ label: string }>;
function render(item: Item, idx: number): JSX.Element {
  return (
    <div key={idx}>
      {item.data.label}
    </div>
  );
}

let revers = false;
let total = 1400;
function loadNext(from: number, count: number): Promise<Array<Item>> {
  let arr: Array<Item> = [];
  count = Math.min(from + count, total) - from;
  while(arr.length < count) {
    let idx = from + arr.length;
    if (revers)
      idx = total - idx - 1;
    arr.push({ data: { label: 'item-' + idx }, id: '' + idx });
  }

  return Promise.resolve(arr);
}

let model = new List2Model<{ label: string }>();
model.setSelectable('multi-select');
storiesOf('list2', module)
  .add('list2', () => {
    return (
      <div style={{
          position: 'absolute',
          left: 0, top: 0, right: 0, bottom: 0,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div>
          <button
            onClick={() => {
              revers = !revers;
              model.clear({reload: true});
            }}
          >revers</button>
        </div>
        <div style={{display: 'flex', flexDirection: 'column', flexGrow: 1}}>
          <FitToParent wrapToFlex>
            <List2 model={model} render={render} loadNext={loadNext}/>
          </FitToParent>
        </div>
      </div>
    );
  });
