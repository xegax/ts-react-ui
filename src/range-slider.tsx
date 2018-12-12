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

export interface Props {
  style?: React.CSSProperties;
  model?: RangeSliderModel;
  className?: string;
  extraClass?: string,
  width?: number;
  height?: number;
  round?: boolean;

  min?: number;
  max?: number;
  range?: Array<number>;

  onChanged?(min: number, max: number);
}

interface State {
  active?: 'left' | 'right' | 'thumb';
  range?: Range;
  model?: RangeSliderModel;
}

export class RangeSliderImpl extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    let model = props.model || new RangeSliderModel();
    if (props.min != null && props.max != null)
      model.setMinMax({from: props.min || 0, to: props.max || 1});
    
    if (props.range != null)
      model.setRange({from: props.range[0], to: props.range[1]});

    this.state = {
      model
    };
  }

  protected subscriber = () => {
    this.setState({});
  }

  componentDidMount() {
    this.state.model.subscribe(this.subscriber);
  }

  componentWillUnmount() {
    this.state.model.unsubscribe(this.subscriber);
  }

  static getDerivedStateFromProps(props: Props, state: State) {
    if (props.range != null)
      state.model.setRange({from: props.range[0], to: props.range[1]});

    if (props.min != null || props.max != null)
      state.model.setMinMax({from: props.min, to: props.max});

    if (props.round != null)
      state.model.setRound(props.round);

    return null;
  }

  protected onChanged() {
    this.props.onChanged && this.props.onChanged(this.state.range.from, this.state.range.to);
  }

  protected onMouseDown = (evt: React.MouseEvent, key: keyof Range) => {
    const model = this.state.model;
    const { width } = this.props;
    const range = model.getRangeForRender(width);

    startDragging({ x: range[key], y: 0 }, {
      onDragStart: () => {
        model.setLastDrag(key);
        this.setState({active: key == 'from' ? 'left' : 'right'});
      },
      onDragging: evt => {
        const range = {...model.getRange()};
        range[key] = model.getRenderForRange(evt.x, width);
        this.setState({ range: model.calcRange(range) });
      },
      onDragEnd: () => {
        this.onChanged();
        model.setRange( this.state.range );
        this.setState({ active: null, range: null });
        model.delayedNotify({type: 'changed'});
      }
    })(evt.nativeEvent);
  }

  protected onMouseDownThumb = (evt: React.MouseEvent) => {
    const model = this.state.model;
    const { width } = this.props;
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
        this.setState({ range: model.calcRange({ from: pos, to: pos + len }) });
      },
      onDragEnd: () => {
        this.onChanged();
        model.setRange( this.state.range );
        this.setState({ active: null, range: null });
        model.delayedNotify({ type: 'changed' });
      }
    })(evt.nativeEvent);
  }

  render() {
    const model = this.state.model;
    const { width, height, className, extraClass, style } = this.props;
    const { active, range } = this.state;
    const rrange = model.getRangeForRender(width, range);
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

export function RangeSlider(props: Props & { wrapToFlex?: boolean }): JSX.Element {
  return (
    <FitToParent wrapToFlex={props.wrapToFlex}>
      <RangeSliderImpl {...props}/>
    </FitToParent>
  );
}
