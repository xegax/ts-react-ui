import * as React from 'react';
import { storiesOf } from '@storybook/react';
import '../src/_base.scss';
import { SortingCtrl, TagExt } from '../src/sorting-ctrl';

let available = [
  'Column1',
  'Column2',
  'Column3',
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
          }}
        />
      </div>
    );
  }
}


storiesOf('Tags', module)
  .add('Tag1', () => {
    return (
      <Dummy/>
    );
  });