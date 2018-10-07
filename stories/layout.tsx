import * as React from 'react';

import { storiesOf } from '@storybook/react';
import { Layout } from '../src/layout';
import { LayoutModel } from '../src/model/layout';
import { Draggable, Droppable } from '../src/drag-and-drop';

function render(id: string, style: React.CSSProperties): JSX.Element {
  style = {flexGrow: 1, border: '1px solid black', ...style};
  return (
    <Droppable types={['item']}>
      <div style={style}>
        {'item ' + id}
        <button onClick={() => {
          model.remove(id);
        }}>remove</button>
      </div>
    </Droppable>
  );
}

const model = new LayoutModel();
const pal = ['#cfcef5', '#aa93d6', '#865f73', '#fecc0c', '#828c59'];
const viewList = pal.map((color, i) => ({
  item: (
    <Draggable
      type='layout'
      data={{idx: i}}
    >
      <div style={{color, cursor: 'default'}}>
        item {i}
      </div>
    </Draggable>
  )
}));

viewList.push({
  item: (
    <Draggable
      type='item'
      data={{}}
    >
      <div>not layout item</div>
    </Draggable>
  )
})

let idCounter = 0;
model.setHandler({
  onDrop: (item: {idx: number}) => {
    idCounter++;
    const newId = 'id-' + idCounter;
    model.getMap()[newId] = render(newId, { backgroundColor: pal[item.idx] });
    return { id: newId };
  }
});


storiesOf('Layout', module)
  .add('layout', () => {
    return (
      <div style={{position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'row'}}>
        <div style={{width: 200, flexGrow: 0, backgroundColor: 'silver', userSelect: 'none'}}>
          {viewList.map(item => item.item)}
        </div>
        <div style={{display: 'flex', flexGrow: 1}}>
          <Layout model={model}/>
        </div>
      </div>
    );
  });