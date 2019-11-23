import * as React from 'react';
import { storiesOf } from '@storybook/react';
import '../src/_base.scss';
import { SortingCtrl, TagExt } from '../src/sorting-ctrl';

let available = [
  { value: 'Column1', render: 'Колонка1' },
  { value: 'Column2', render: 'Колонка2' },
  { value: 'Column3', render: 'Колонка3' },
];

let sorting = new Array<TagExt>();
let reverse = false;
class Dummy extends React.Component {
  render() {
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div>Records: 1000</div>
        <SortingCtrl
          style={{ flexGrow: 1 }}
          available={available}
          sorting={sorting}
          reverse={reverse}
          onReverse={newReverse => {
            reverse = newReverse;
            this.setState({});
          }}
          onApply={newSorting => {
            sorting = newSorting;
            console.log(sorting);
            this.setState({});
            return Promise.delay(2000) as any;
          }}
        />
      </div>
    );
  }
}


storiesOf('SortingCtrl', module)
  .add('SortingCtrl', () => {
    return (
      <Dummy/>
    );
  });