import * as React from 'react';
import { FitToParent } from '../src/fittoparent';
import { storiesOf } from '@storybook/react';
import { Tree, TreeModel } from '../src/tree';
import '../styles/styles.scss';

let model = new TreeModel();
model.setItems([
  {
    label: 'root',
    children: [
      {
        label: 'item 1'
      }, {
        label: 'item 2'
      }, {
        label: 'item 3'
      }, {
        label: 'item 4'
      }
    ]
  },
  {
    label: 'root2',
    children: [
      {
        label: 'item 5'
      }
    ]
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
