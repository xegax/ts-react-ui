import * as React from 'react';

import { storiesOf } from '@storybook/react';
import { Layout } from '../src/layout';
import { LayoutModel } from '../src/model/layout';
import { Draggable } from '../src/drag-and-drop';

function item(n: number, style: React.CSSProperties): JSX.Element {
  style = {flexGrow: 1, border: '1px solid black', ...style};
  return <div style={style}>{'item ' + n}</div>;
}

const model = new LayoutModel();
model.getMap()['i1'] = item(1, {backgroundColor: 'purple'});
model.getMap()['i2'] = item(2, {backgroundColor: 'lightgreen'});
model.getMap()['i3'] = item(3, {backgroundColor: 'lightblue'});
model.getMap()['i4'] = item(4, {backgroundColor: 'lightblue'});
model.getMap()['i5'] = item(5, {backgroundColor: 'lightblue'});
model.getMap()['i6'] = item(6, {backgroundColor: 'lightblue'});

storiesOf('Layout', module)
  .add('layout', () => {
    return (
      <div style={{position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'row'}}>
        <div style={{width: 200, flexGrow: 0, backgroundColor: 'silver', userSelect: 'none'}}>
          <Draggable data={{id: 'i1'}}><div>item 1</div></Draggable>
          <Draggable data={{id: 'i2'}}><div>item 2</div></Draggable>
          <Draggable data={{id: 'i3'}}><div>item 3</div></Draggable>
          <Draggable data={{id: 'i4'}}><div>item 4</div></Draggable>
          <Draggable data={{id: 'i5'}}><div>item 5</div></Draggable>
          <Draggable data={{id: 'i6'}}><div>item 6</div></Draggable>
        </div>
        <div style={{display: 'flex', flexGrow: 1}}>
          <Layout model={model}/>
        </div>
      </div>
    );
  });