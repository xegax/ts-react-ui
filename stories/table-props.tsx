import * as React from 'react';
import { storiesOf } from '@storybook/react';
import { FilterPanel, FilterPanelView } from '../src/panel/filter-panel';
import { PropSheet } from '../src/prop-sheet';
import { FilterTgt, ColItem, Value } from '../src/panel/filter-panel-decl';

function makeCatColumn(name: string, total: number): ColItem {
  let values: Array<Value> = [];
  while (values.length < total) {
    values.push({ value: 'item-' + values.length, count: Math.round(Math.random() * 1024) });
  }

  let filtered: Array<Value>;
  return {
    name,
    type: 'varchar',
    getValues: args => {
      console.log('getValues', args.filters);
      return Promise.resolve({
        total: values.length,
        values: (filtered || values).slice(args.from, args.from + args.count)
      });
    },
    setFilter: args => {
      filtered = args.filter ? values.filter(v => v.value.indexOf(args.filter) != -1) : null;
      return Promise.resolve({ total: (filtered || values).length });
    },
    setSort: () => {
      return Promise.delay(1000) as any;
    }
  };
}

function makeRangeColumn(name: string, type: 'real' | 'integer', minMax: Array<number>): ColItem {
  return {
    name,
    type,
    getNumRange: () => 
      (Promise.delay(999) as any as Promise<void>)
      .then(() => ({
        minMax
      }))
  };
}

let model = new FilterPanel([
  { name: 'id', type: 'integer' },
  makeCatColumn('name', 999),
  { name: 'descr', type: 'text' },
  makeRangeColumn('size', 'real', [50, 110]),
  makeCatColumn('type', 1000)
]);

function printFilter(tgt: FilterTgt) {
  const arr = model.getFiltersArr('include');
  console.log('changed', arr);
}

model.subscribe(() => {
  printFilter('include');
}, 'change-filter-values');

storiesOf('Table props', module)
  .add('props', () => {
    return (
      <div style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, overflow: 'hidden', display: 'flex' }}>
        <div style={{ position: 'relative', display: 'flex', flexGrow: 1 }}>
          <PropSheet defaultWidth={200} resize>
            <FilterPanelView
              model={model}
            />
          </PropSheet>
          <div
            style={{
              flexGrow: 1,
              backgroundColor: 'silver',
              border: '1px solid green',
              margin: '5px'
            }}
          />
        </div>
      </div>
    );
  });