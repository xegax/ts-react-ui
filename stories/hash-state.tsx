import * as React from 'react';
import '../src/_base.scss';
import { storiesOf } from '@storybook/react';
import { Item, DropDown } from '../src/drop-down';
import { HashState } from '../src/hash-state';

interface AppState {
  object: string;
  panel: number;
}

class Control extends React.Component {
  hs = new HashState<AppState>();

  componentDidMount() {
    this.hs.subscribe(this.onStateChange);
  }

  onStateChange = () => {
    this.setState({});
  };

  render() {
    return (
      <>
        <div>
          <DropDown
            value={{ value: this.hs.getString('object') }}
            values={[
              { value: 'obj1' },
              { value: 'obj2' },
              { value: 'obj3' },
              { value: 'obj4' }
            ]}
            onSelect={sel => {
              this.hs.pushState({ object: sel.value });
            }}
          />
        </div>
      </>
    );
  }
}

storiesOf('hash-state test', module)
  .add('test 1', () => {
    return <Control/>;
  });
