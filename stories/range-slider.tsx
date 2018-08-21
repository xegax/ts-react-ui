import * as React from 'react';

import { storiesOf } from '@storybook/react';
import { RangeSlider, RangeSliderModel } from '../src/range-slider';

const model = new RangeSliderModel();
model.setMinMax({from: 1890, to: 2011});

class Test extends React.Component<{}, {}> {
  subscriber = () => {
    this.setState({});
  }

  componentDidMount() {
    model.subscribe(this.subscriber, 'changed');
  }

  componentWillUnmount() {
    model.unsubscribe(this.subscriber, 'changed');
  }

  render() {
    return (
      <div style={{display: 'flex', flexDirection: 'column'}}>
        <div>
          from: {model.getRange().from}
        </div>
        <div>
          to: {model.getRange().to}
        </div>
        <div style={{marginLeft: 50, marginRight: 50, height: 20}}>
          <RangeSlider model={model}/>
        </div>
        <div style={{height: 15}}>
          <RangeSlider model={model}/>
        </div>
        <div style={{display: 'flex'}}>
          <div style={{flexGrow: 1}}>
            <RangeSlider model={model}/>
          </div>
          <div style={{flexGrow: 1}}>
            <RangeSlider model={model}/>
          </div>
          <div style={{flexGrow: 1}}>
            <RangeSlider model={model}/>
          </div>
        </div>
      </div>
    );
  }
}

storiesOf('range slider', module)
  .add('slider', () => (
    <Test/>
  ));