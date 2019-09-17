import * as React from 'react';
import '../src/_base.scss';
import { storiesOf } from '@storybook/react';
import { Item, DropDown } from '../src/drop-down';
import { DropDownLoadable } from '../src/drop-down-loadable';

const dd2 = new Array(50).fill(null).map((item, i) => ({ value: 'item - ' + Math.random().toString(16).substr(2) }));

class DataModel {
  private pref: string;
  private items = new Array<Item>();
  private timeout: number;
  private key: number = 0;
  private serverItems = Array<Item>();
  private filteredItems: Array<Item> = null;

  constructor(total: number, timeout: number = 100, pref: string = 'loaded') {
    this.pref = pref;
    this.timeout = timeout;
    this.serverItems = new Array(total).fill(null).map((v, i) => {
      return {
        value: [this.pref, i].join(' ')
      };
    }); 
  }

  loadNext(from: number, count: number): Promise< Array<Item> > {
    return (
      (Promise.delay(this.timeout) as any as Promise<void>)
      .then(() => {
        const arr: Array<Item> = (this.filteredItems || this.serverItems).slice(from, from + count);
        this.items.push(...arr);
        return arr;
      })
    );
  }

  setFilter(filter: string): Promise< Array<Item> > {
    if (!filter) {
      this.filteredItems = null;
      console.log('filter empty');
    } else {
      this.filteredItems = this.serverItems.filter(item => {
        return item.value.indexOf(filter) != -1;
      });
      console.log('filter', this.filteredItems.length);
    }
    this.key++;
    return this.loadNext(0, 50);
  }

  getTotal() {
    if (this.filteredItems)
      return this.filteredItems.length;

    return this.serverItems.length;
  }
}

let data1 = new DataModel(1000);
class Control extends React.Component {
  private select: Item;

  setSelect(item: Item) {
    this.select = item;
    this.setState({});
  }

  render() {
    return (
      <div className='card-2 vert-panel-1 round-border-2'>
        <div className='horz-panel-1'>
          <DropDownLoadable
            width={200}
            totalValues={data1.getTotal()}
            onLoadNext={(from, count) => data1.loadNext(from, count)}
            onFilter={filter => data1.setFilter(filter)}
            value={this.select}
            onSelect={item => this.setSelect(item)}
          />
          <button onClick={() => {
            this.select = { value: 'loaded 233' };
            this.setState({});
          }}>
            item 233
          </button>
        </div>
        <div className='horz-panel-1'>
          <DropDown
            values={dd2}
          />
        </div>
      </div>
    );
  }
}

storiesOf('drop-down-list', module)
  .add('drop-down-list2', () => {
    return <Control/>;
  });
