import * as React from 'react';
import { FitToParent } from '../src/control/fittoparent';
import { storiesOf } from '@storybook/react';
import { List, RenderListModel, RenderArgs } from '../src/control/list';
import '../styles/styles.scss';
import { timer } from '../src/common/promise';

let model = new RenderListModel(10000, 20);
interface Row {
  label: string;
  time: number;
  idx: number;
}

model.setLoader((from, count) => {
  let arr = Array<Row>();
  while (arr.length < count)
    arr.push({label: `row: ${from + arr.length}`, time: Date.now(), idx: arr.length});
  return timer(1000).then(() => arr);
});

model.setColumns([
  {
    name: '1',
    width: 100,
    render: (args: RenderArgs<Row>) => '[' + args.item.label + ']'
  }, {
    name: '2',
    render: (args: RenderArgs<Row>) => '{' + args.item.time + '}'
  }, {
    name: '3',
    width: -1,
    render: (args: RenderArgs<Row>) => '"' + args.item.idx + '"'
  }
]);

storiesOf('list', module)
  .add('with text', () => {
    return (
      <div style={{position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, display: 'flex'}}>
        <div style={{display: 'flex', flexDirection: 'column', flexGrow: 1}}>
          <div>
            <button onClick={() => model.reload()}>reload</button>
          </div>
          <div style={{flexGrow: 1, position: 'relative'}}>
            <FitToParent absolute><List border model={model}/></FitToParent>
          </div>
        </div>
      </div>
    );
  });
