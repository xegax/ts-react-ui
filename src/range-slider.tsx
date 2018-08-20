import * as React from 'react';
import { RangeSliderModel } from './model/range-slider';
import './_range-slider.scss';
import { startDragging } from './common/start-dragging';

export {
  RangeSliderModel
}

const classes = {
  rangeSlider: 'range-slider-ctrl',
  slider: 'range-slider-ctrl-slider'
};

interface Props {
  model: RangeSliderModel;
  width?: number;
}

interface State {
  to: number;
  from: number;
}

export class RangeSlider extends React.Component<Props, State> {
  state: Readonly<State> = { from: 0, to: 100 };

  subscriber = () => {
    this.setState(this.props.model.getRangeForRender(100));
  }

  componentDidMount() {
    this.props.model.subscribe(this.subscriber);
  }

  componentWillUnmount() {
    this.props.model.unsubscribe(this.subscriber);
  }

  /*shouldComponentUpdate(props: Props) {
    return props.width != this.props.width;
  }*/

  render() {
    const range = this.props.model.getRangeForRender(this.props.width);
    console.log(range, this.props.width);
    return (
      <div className={classes.rangeSlider}>
        <div
          className={classes.slider}
          style={{ left: range.from }}
          onMouseDown={evt => {
            startDragging({ x: range.from, y: 0 }, {
              onDragging: evt => {
                this.props.model.setRange({from: this.props.model.getRenderForRange(evt.x, this.props.width)});
              }
            })(evt.nativeEvent);
          }}
        />
        <div
          className={classes.slider}
          style={{ right: (this.props.width - 20) - range.to }}
          onMouseDown={evt => {
            startDragging({ x: (this.props.width - 20) - range.to, y: 0 }, {
              onDragging: evt => {
                this.props.model.setRange({to: this.props.model.getRenderForRange(evt.x, this.props.width)});
              }
            })(evt.nativeEvent);
          }}
        />
      </div>
    );
  }
}
