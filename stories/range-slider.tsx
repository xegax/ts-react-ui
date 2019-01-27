import * as React from 'react';

import { storiesOf } from '@storybook/react';
import { RangeSlider, RangeSliderModel } from '../src/range-slider';

const model = new RangeSliderModel();
model.setMinMax({from: 0, to: 455});

class Test extends React.Component<{}, {pos: number}> {
  state = { pos: 0 };
  
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
        <div>
          pos: {this.state.pos}
        </div>
        <div style={{marginLeft: 50, marginRight: 50, height: 20}}>
          <RangeSlider
            valueEnabled
            model={model}
            onSeek={pos => this.setState({pos})}
          />
        </div>
        <div style={{height: 15}}>
          <RangeSlider valueEnabled model={model}/>
        </div>
        <div style={{display: 'flex'}}>
          <div style={{flexGrow: 1}}>
            <RangeSlider valueEnabled model={model}/>
          </div>
          <div style={{flexGrow: 1}}>
            <RangeSlider valueEnabled model={model}/>
          </div>
          <div style={{flexGrow: 1}}>
            <RangeSlider valueEnabled model={model}/>
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