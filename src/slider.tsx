import * as React from 'react';
import { startDragging } from './common/start-dragging';
import { cn, clamp } from './common/common';
import { FitToParent } from './fittoparent';
import { Publisher } from 'objio';

class SliderModel extends Publisher {
  private value: number = 0;
  private from: number = 0;
  private to: number = 1;
  private sliderSize: number = 15;
  private round: boolean = false;

  setMinMax(min?: number, max?: number): boolean {
    if (min == null)
      min = this.from;
    if (max == null)
      max = this.to;

    if (this.from == min && this.to == max)
      return false;

    this.from = min;
    this.to = max;
    this.delayedNotify();
    return true;
  }

  fixNewValue(value: number): number {
    if (this.round)
      value = value = Math.round(value);

    value = clamp(value, [this.from, this.to]);
    return value;
  }

  setValue(value: number): boolean {
    if (this.value == value)
      return false;

    this.value = this.fixNewValue(value);
    this.delayedNotify();
    return true;
  }

  getValue(): number {
    return this.value;
  }

  getValueForRender(width: number, value?: number): number {
    const slider = this.getSliderSize();
    value = value == null ? this.value : value;
    const size = this.to - this.from;
    return Math.round((value - this.from) * ( width - slider ) / size);
  }

  getRenderForValue(pos: number, width: number): number {
    const slider = this.getSliderSize();
    const size = this.to - this.from;
    return this.from + size * pos / (width - slider);
  }

  getSliderSize() {
    return this.sliderSize;
  }

  setRound(round: boolean) {
    this.round = round;
  }
}

const classes = {
  rangeSlider: 'slider-ctrl',
  slider: 'slider-ctrl-slider',
  thumb: 'slider-thumb',
  disabled: 'disabled'
};

export interface Props {
  disabled?: boolean;
  style?: React.CSSProperties;
  model?: SliderModel;
  className?: string;
  extraClass?: string,
  width?: number;
  height?: number;
  round?: boolean;

  min?: number;
  max?: number;
  value?: number;

  onChange?(value: number);
  onChanged?(value: number);
}

interface State {
  model?: SliderModel;
}

export class SliderImpl extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    let model = props.model || new SliderModel();
    if (props.min != null && props.max != null)
      model.setMinMax(props.min, props.max);
    
    if (props.value != null)
      model.setValue(props.value);

    if (props.round != null)
      model.setRound(props.round);

    if (props.onChanged)
      model.subscribe(() => props.onChanged(model.getValue()), 'changed');

    this.state = {
      model
    };
  }

  protected subscriber = () => {
    this.setState({});
  }

  static getDerivedStateFromProps(props: Props, state: State) {
    if (props.value != null)
      state.model.setValue(props.value);

    if (props.min != null || props.max != null)
      state.model.setMinMax(props.min, props.max);

    if (props.round != null)
      state.model.setRound(props.round);

    return null;
  }

  componentDidMount() {
    this.state.model.subscribe(this.subscriber);
  }

  componentWillUnmount() {
    this.state.model.unsubscribe(this.subscriber);
  }

  private dragging: number;
  protected onMouseDown = (evt: React.MouseEvent) => {
    if (this.props.disabled)
      return;

    const model = this.state.model;
    const { width } = this.props;
    const value = model.getValueForRender(width);

    startDragging({ x: value, y: 0 }, {
      onDragStart: () => {
        this.dragging = model.getValue();
      },
      onDragging: evt => {
        let dragging = model.fixNewValue(model.getRenderForValue(evt.x, width));
        if (dragging == this.dragging)
          return;

        this.props.onChange && this.props.onChange(this.dragging = dragging);
        this.setState({});
      },
      onDragEnd: () => {
        model.setValue(this.dragging);
        this.dragging = null;
        model.delayedNotify({type: 'changed'});
      }
    })(evt.nativeEvent);
  }

  render() {
    const model = this.state.model;
    const sliderSize = model.getSliderSize();
    const { width, className, height, extraClass, style, disabled } = this.props;
    const rvalue = model.getValueForRender(width, this.dragging);
    return (
      <div
        title={'' + model.getValue()}
        className={cn(className || classes.rangeSlider, extraClass, disabled && classes.disabled)}
        style={{ ...style, height }}>
        <div className={cn(classes.thumb)} style={{ width }}/>
        <div
          tabIndex={1}
          className={cn(classes.slider)}
          style={{
            borderRadius: sliderSize,
            left: rvalue,
            width: sliderSize,
            height: sliderSize,
            top: height / 2 - sliderSize / 2
          }}
          onMouseDown={evt => this.onMouseDown(evt)}
        />
      </div>
    );
  }
}

export function Slider(props: Props & { wrapToFlex?: boolean }): JSX.Element {
  return (
    <FitToParent wrapToFlex={props.wrapToFlex} calcH={props.height == null}>
      <SliderImpl {...props}/>
    </FitToParent>
  );
}
