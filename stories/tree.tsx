import * as React from 'react';
import { storiesOf } from '@storybook/react';
import '../src/_base.scss';
import { Tree, TreeItem } from '../src/tree/tree';
import { Droppable, DropArgs } from '../src/drag-and-drop';
import { ValuePath, updateValues } from '../src/tree/tree-model';

function getSubitems(pref: string, count: number): Array<TreeItem> {
  let arr = Array<TreeItem>();
  while (arr.length < count)
    arr.push({ value: `${pref}-${arr.length}` });

  return arr;
}

function delay(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

let values2: Array<TreeItem> = [
  {
    value: 'root',
    draggable: false,
    render: <span style={{ color: 'gray' }}>root</span>,
    children: [
      {
        value: 'system',
        children: [
          {
            value: 'CPU',
            children: [
              { value: 'Core1 4GHz', children: [] },
              { value: 'Core2 4GHz', children: [] }
            ]
          }, {
            value: 'HDD',
            children: []
          }, {
            value: 'MEMORY',
            children: []
          }
        ]
      },
      {
        value: 'entity',
        rightIcons: <><i className='fa fa-trash'/></>,
        children: [
          {
            value: 'people',
            children: []
          }, {
            value: 'async',
            children: (item) => delay(500).then(() => item.childrenCache = getSubitems('async', 50))
          }, {
            value: 'animal',
            children: [
              {
                value: 'pets',
                children: [
                  { value: 'cat', children: [] },
                  { value: 'dog', children: [] },
                  { value: 'turtle', children: [] },
                  { value: 'cow', children: [] }
                ]
              }, {
                value: 'wild',
                droppable: false,
                children: [
                  { value: 'wolf', children: [] },
                  { value: 'bear', children: [] },
                  { value: 'fox', children: [] }
                ]
              }
            ]
          }, {
            value: 'plant',
            children: []
          }
        ]
      }
    ]
  }
];

function clone(arr: Array<TreeItem>) {
  return arr.map(item => {
    item = {...item};
    item.children = Array.isArray(item.children) ? clone(item.children) : item.children;
    if (item.childrenCache)
      item.childrenCache = clone(item.childrenCache);

    return item;
  });
}

let valuesCopy: Array<TreeItem> = clone(values2);

interface State {
  select?: Array<ValuePath>;
}

class Dummy extends React.Component<{}, State> {
  state: State = {
    select: [ ['root', 'entity', 'animal', 'pets', 'dog' ] ]
  };

  onDrop = (args: DropArgs<TreeItem, TreeItem>) => {
    console.log(args.dragData);
  };

  updateValues = () => {
    updateValues(clone(values2), valuesCopy);
    valuesCopy = valuesCopy.slice();
    this.setState({});
  }

  render() {
    return (
      <div style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flexGrow: 1, display: 'flex' }}>
          <Tree
            multiselect
            style={{ flexGrow: 0, width: 150 }}
            select={this.state.select}
            values={values2}
            onOpen={this.updateValues}
            onClose={this.updateValues}
            onDragAndDrop={args => {
              Tree.onDragAndDrop(args);
              this.updateValues();
            }}
            onSelect={pathArr => {
              this.setState({ select: pathArr.map(path => path.map(v => v.value)) });
              // console.log(select.join('->'));
            }}
          />
          <Tree
            multiselect
            style={{ flexGrow: 0, width: 150 }}
            select={this.state.select}
            values={valuesCopy}
          />
          <div style={{ flexGrow: 1, backgroundColor: 'silver', position: 'relative' }}>
            <Droppable onDrop={this.onDrop}>
              <div style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0}}>
              </div>
            </Droppable>
          </div>
        </div>
        <div style={{ flexGrow: 0 }}>
          {this.state.select.map((p, i) => <div key={i}>{p.join('/')}</div>)}
        </div>
      </div>
    );
  }
}

storiesOf('Tree', module)
  .add('Tree1', () => {
    return (
      <Dummy/>
    );
  });
