import * as React from 'react';
import { FitToParent } from '../src/fittoparent';
import { storiesOf } from '@storybook/react';
import { List, RenderListModel } from '../src/list';
import { RenderArgs } from '../src/model/list';
import '../styles/styles.scss';
import { timer } from '../src/common/promise';
import { KeyCode } from '../src/common/keycode';

let items = Array<Row>();
while(items.length < 2000)
  items.push({label: `row: ${items.length}`, time: Date.now(), idx: items.length});

let model = new RenderListModel(items.length, 20);
interface Row {
  label: string;
  time: number;
  idx: number;
}

model.setHandler({
  loadItems: (from, count) => {
    return timer(10).then(() => items.slice(from, from + count));
  }
});

model.setColumns([
  {
    name: '2',
    render: (args: RenderArgs<Row>) => '{' + args.item.time + '}'
  }, {
    name: '1',
    width: 100,
    render: (args: RenderArgs<Row>) => '[' + args.item.label + ']'
  }, {
    name: '3',
    width: -1,
    render: (args: RenderArgs<Row>) => '"' + args.item.idx + '"'
  }
]);
model.setHeaderSize(100);
model.setSelType('single');
model.setBufferSize(200);

let list = new RenderListModel(1000);
list.setHandler({
  loadItems: (from, count) => {
    let arr = Array<Row>();
    while (arr.length < count)
      arr.push({label: `row: ${from + arr.length}`, time: Date.now(), idx: arr.length});
    return timer(1000).then(() => arr.map(item => item.label));
  }
});

let counts = [5, 1000, 10000];
let countIdx = 0;
storiesOf('list', module)
  .add('table', () => {
    return (
      <div style={{position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, display: 'flex'}}>
        <div style={{display: 'flex', flexDirection: 'column', flexGrow: 1}}>
          <div>
            <button onClick={() => model.reload()}>reload</button>
            <button onClick={() => model.setItemsCount(counts[countIdx++ % counts.length])}>count</button>
          </div>
          <FitToParent wrapToFlex>
            <List border model={model} onKeyDown={evt => {
              if (evt.keyCode == KeyCode.DELETE) {
                const idxs = model.getSel().map(idx => +idx).sort((a, b) => b - a);
                idxs.forEach(idx => {
                  items.splice(idx, 1);
                });
                model.setItemsCount(items.length);
                model.reload();
                model.clearSel();
                console.log(idxs);
              }
            }}/>
          </FitToParent>
        </div>
      </div>
    );
  })
  .add('list', () => {
    return (
      <div style={{position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, display: 'flex'}}>
        <div style={{display: 'flex', flexDirection: 'column', flexGrow: 1}}>
          <FitToParent wrapToFlex>
            <List border model={list}/>
          </FitToParent>
        </div>
      </div>
    );
  });
