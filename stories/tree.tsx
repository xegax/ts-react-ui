import * as React from 'react';
import { FitToParent } from '../src/fittoparent';
import { storiesOf } from '@storybook/react';
import { Tree, TreeItem, TreeModel } from '../src/tree';
import '../styles/styles.scss';

function makeItems(count: number, cb: (n: number) => TreeItem): Array<TreeItem> {
  let arr = Array<TreeItem>();
  while (arr.length < count)
    arr.push(cb(arr.length));
  return arr;
}

let model = new TreeModel();
model.setItems([
  {
    label: 'root',
    children: makeItems(10, (i) => ({ label: 'item ' + i }))
  },
  {
    label: 'root2',
    children: makeItems(10, (i) => ({ label: 'item ' + i }))
  }
])

storiesOf('tree', module)
  .add('tree', () => {
    return (
      <div style={{position: 'absolute', left: 0, top: 0, right: 0, bottom: 0}}>
        <FitToParent>
          <Tree model={model}/>
        </FitToParent>
      </div>
    );
  });
