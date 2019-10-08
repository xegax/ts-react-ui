import * as React from 'react';
import { storiesOf } from '@storybook/react';
import '../src/_base.scss';
import { Tree, TreeItem } from '../src/tree/tree';

let values2: Array<TreeItem> = [
  {
    value: 'root',
    render: <span style={{ color: 'gray' }}>root</span>,
    children: [
      {
        value: 'system',
        children: [
          {
            value: 'CPU',
            children: [
              { value: 'Core1 4GHz' },
              { value: 'Core2 4GHz' }
            ]
          }, {
            value: 'HDD'
          }, {
            value: 'MEMORY'
          }
        ]
      },
      {
        value: 'entity',
        children: [
          {
            value: 'people'
          }, {
            value: 'animal',
            children: [
              {
                value: 'pets',
                children: [
                  { value: 'cat' },
                  { value: 'dog' },
                  { value: 'turtle' },
                  { value: 'cow' }
                ]
              }, {
                value: 'wild',
                children: [
                  { value: 'wolf' },
                  { value: 'bear' },
                  { value: 'fox' }
                ]
              }
            ]
          }, {
            value: 'plant'
          }
        ]
      }
    ]
  }
];

interface State {
  select?: Array<string>;
}

class Dummy extends React.Component<{}, State> {
  state: State = { };

  render() {
    return (
      <Tree
        select={this.state.select}
        defaultSelect={['root', 'entity', 'animal', 'pets', 'dog' ]}
        values={values2}
        onSelect={path => {
          const select = path.map(p => p.value);
          this.setState({ select });
          console.log(select.join('->'));
        }}
      />
    );
  }
}

storiesOf('Tree', module)
  .add('Tree1', () => {
    return (
      <Dummy/>
    );
  });
