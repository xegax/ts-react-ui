import * as React from 'react';
import { storiesOf } from '@storybook/react';
import { PropertySheet, PropertyItem, PropItemGroup } from '../src/property-sheet';
import { prompt } from '../src/prompt';
// import { PropertySheetModel } from '../src/property-sheet/property-sheet-model';

const groups: Array<PropItemGroup> = [
  {
    group: 'object',
    maxHeight: 100,
    items: [
      {
        name: 'select',
        value: 'two',
        items: ['one', 'two', 'three', 'four'],
        setValue(v: string) {
          this.value = 'one';
        }
      },
      {
        name: 'id',
        value: '0001',
        render: (item: PropertyItem) => '[' + item.value + ']'
      }, {
        name: 'name',
        value: 'some name'
      }, {
        name: 'title',
        value: 'empty',
        render: (item: PropertyItem) => item.value
      }, {
        name: 'project',
        value: 'xxx-xxxx-xxxx-xxx',
        readOnly: true
      }, {
        name: 'date',
        value: '01/02/2018',
        readOnly: true
      }, {
        name: 'readOnly',
        value: 'false',
        readOnly: true
      }, {
        name: 'show',
        value: true,
      }, {
        value: 11,
        name: 'count'
      }, {
        name: 'choose',
        value: '22',
        items: ['11', '22', '33', '44']
      }
    ]
  }, {
    group: 'styles',
    items: [
      {
        name: 'color',
        value: '#5500ff',
        action: (item: PropertyItem) => prompt({ title: 'enter color', value: item.value })
      }
    ]
  }, {
    group: 'preview',
    render: () => {
      return (
        <div
          style={{
            height: 200,
            backgroundImage: 'url(https://www.wikipedia.org/portal/wikipedia.org/assets/img/Wikipedia-logo-v2@1.5x.png)',
            backgroundPosition: 'center',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat'
          }}
        />
      );
    }
  }
];

storiesOf('Prop sheet', module)
  .add('property', () => {
    return (
      <React.Fragment>
        <div style={{ backgroundColor: 'silver', width: 200 }}>
          <PropertySheet items={[{ group: 'root', items: groups }]}/>
        </div>
      </React.Fragment>
    );
  });