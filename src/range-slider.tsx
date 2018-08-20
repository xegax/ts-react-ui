import * as React from 'react';
import { RangeSliderModel, Range } from './model/range-slider';
import './_range-slider.scss';
import { startDragging } from './common/start-dragging';
import { className as cn } from './common/common';
import { FitToParent } from './fittoparent';
import { Subscriber } from './subscriber';

export {
  RangeSliderModel
}

const classes = {
  rangeSlider: 'range-slider-ctrl',
  slider: 'range-slider-ctrl-slider',
  sliderLeft: 'slider-left',
  sliderRight: 'slider-right',
  active: 'slider-active',
  thumb: 'range-slider-ctrl-thumb'
};

interface Props {
  style?: React.CSSProperties;
  model: RangeSliderModel;
  className?: string;
  extraClass?: string,
  width?: number;
  height?: number;
}

interface State {
  active?: 'left' | 'right' | 'thumb';
}

export class RangeSliderImpl extends Subscriber<Props, State> {
  state: Readonly<State> = {};

  protected onMouseDown = (evt: React.MouseEvent, key: keyof Range) => {
    const { width, model } = this.props;
    const range = model.getRangeForRender(width);

    startDragging({ x: range[key], y: 0 }, {
      onDragStart: () => {
        model.setLastDrag(key);
        this.setState({active: key == 'from' ? 'left' : 'right'});
      },
      onDragging: evt => {
        model.setRange({[key]: model.getRenderForRange(evt.x, width)});
      },
      onDragEnd: () => {
        this.setState({ active: null });
        model.delayedNotify({type: 'changed'});
      }
    })(evt.nativeEvent);
  }

  protected onMouseDownThumb = (evt: React.MouseEvent) => {
    const { width, model } = this.props;
    const rrange = model.getRangeForRender(width);
    const range = model.getRange();
    const minMaxRange = model.getMinMax();
    const len = range.to - range.from;
    const minMax = [ minMaxRange.from, range.from + minMaxRange.to - range.to ];

    startDragging({ x: rrange.from, y: 0}, {
      onDragStart: () => {
        model.setLastDrag('thumb');
        this.setState({ active: 'thumb' });
      },
      onDragging: evt => {
        let pos = model.getRenderForRange(evt.x, width);
        pos = Math.min(minMax[1], pos);
        pos = Math.max(minMax[0], pos);
        model.setRange({ from: pos, to: pos + len });
      },
      onDragEnd: () => {
        this.setState({ active: null });
        model.delayedNotify({ type: 'changed' });
      }
    })(evt.nativeEvent);
  }

  render() {
    const { model, width, height, className, extraClass, style } = this.props;
    const { active } = this.state;
    const rrange = model.getRangeForRender(width);
    return (
      <div className={cn(className || classes.rangeSlider, extraClass)} style={{ ...style, height }}>
        <div
          className={cn(classes.thumb, active == 'thumb' && classes.active)}
          style={{ left: rrange.from, right: (width - model.getSliderSize() * 2) - rrange.to }}
          onMouseDown={this.onMouseDownThumb}
        />
        <div
          className={cn(classes.slider, classes.sliderLeft, active == 'left' && classes.active)}
          style={{ left: rrange.from, height }}
          onMouseDown={evt => this.onMouseDown(evt, 'from')}
        />
        <div
          className={cn(classes.slider, classes.sliderRight, active == 'right' && classes.active)}
          style={{ right: (width - model.getSliderSize() * 2) - rrange.to, height }}
          onMouseDown={evt => this.onMouseDown(evt, 'to')}
        />
      </div>
    );
  }
}

export function RangeSlider(props: Props): JSX.Element {
  return (
    <FitToParent>
      <RangeSliderImpl {...props}/>
    </FitToParent>
  );
}
