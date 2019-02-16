import * as React from 'react';
import { storiesOf } from '@storybook/react';
import { Timeline, Range } from '../src/timeline';
import '../src/_base.scss';

interface State {
  trim: Range;
  value: number;
}

class Dummy extends React.Component<{}, Partial<State>> {
  state: Partial<State> = { value: 25 };

  render() {
    return (
      <Timeline
        height={20}
        minValue={0}
        maxValue={50}
        trim={this.state.trim}
        value={this.state.value}
        onChangingTrim={trim => {
          if (trim.from != null)
            this.setState({ value: trim.from });
          else if (trim.to != null)
            this.setState({ value: trim.to });
        }}
        onChangedTrim={(trim: Range) => {
          console.log(trim);
          this.setState({trim});
        }}
        onChangingValue={value => {
          this.setState({value});
        }}
        onChangedValue={value => {
          this.setState({value});
          console.log('changed', value);
        }}
      />
    );
  }
}

storiesOf('Timeline', module)
  .add('Timeline', () => {
    return (
      <Dummy/>
    );
  });