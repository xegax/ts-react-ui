import * as React from 'react';
import { RangeSliderModel, Range } from './model/range-slider';
import { startDragging } from './common/start-dragging';
import { className as cn, clamp } from './common/common';
import { FitToParent } from './fittoparent';
import './_range-slider.scss';

export {
  RangeSliderModel
}

const classes = {
  rangeSlider: 'range-slider-ctrl',
  sliderValue: 'slider-value',
  slider: 'range-slider-ctrl-slider',
  sliderLeft: 'slider-left',
  sliderRight: 'slider-right',
  active: 'slider-active',
  thumb: 'range-slider-ctrl-thumb',
  thumbRange: 'range-slider-ctrl-thumbrange'
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
  value?: number;
  dragThumb?: boolean;

  onChanged?(min: number, max: number);
  onChanging?(min: number, max: number, element: 'left' | 'right' | 'thumb' | 'value');
  onSeek?(value: number);
  onSeeked?(value: number);
}

interface State {
  active?: 'left' | 'right' | 'thumb' | 'value';
  range?: Range;
  model?: RangeSliderModel;
  value?: number;
}

export class RangeSliderImpl extends React.Component<Props, State> {
  private ref = React.createRef<HTMLDivElement>();

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

    if (props.height != null) {
      state.model.setSliderSize(props.height);
    }

    return null;
  }

  protected onChanged() {
    this.props.onChanged && this.props.onChanged(this.state.range.from, this.state.range.to);
  }

  protected onChanging = () => {
    this.props.onChanging && this.props.onChanging(this.state.range.from, this.state.range.to, this.state.active);
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
        if (key == 'from')
          range[key] = clamp(range[key], [model.getMinMax().from, range.to]);
        else if (key == 'to')
          range[key] = clamp(range[key], [range.from, model.getMinMax().to]);
        this.setState({ range }, this.onChanging);
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
        this.setState({ range: model.calcRange({ from: pos, to: pos + len }) }, this.onChanging);
      },
      onDragEnd: () => {
        this.onChanged();
        model.setRange( this.state.range );
        this.setState({ active: null, range: null });
        model.delayedNotify({ type: 'changed' });
      }
    })(evt.nativeEvent);
  }

  onSeek = (e: React.MouseEvent) => {
    const skip = [classes.sliderLeft, classes.sliderRight, classes.thumbRange];
    if ((e.target as HTMLElement).className.split(' ').some( v => skip.indexOf(v) != -1))
      return;

    const bbox = this.ref.current.getBoundingClientRect();
    const p = e.pageX - bbox.left;
    this.setState({ value: this.state.model.getPosition(this.props.width, p) });
    startDragging({x: p, y: 0}, {
      onDragging: evt => {
        const minMax = this.state.model.getMinMax();
        let newp = this.state.model.getPosition(this.props.width, evt.x);
        newp = clamp(newp, [ minMax.from, minMax.to ]);
        this.setState({ value: newp });
        this.props.onSeek && this.props.onSeek(newp);
      },
      onDragEnd: () => {
        this.props.onSeeked && this.props.onSeeked(this.state.value);
      }
    })(e.nativeEvent);
  };

  render() {
    const model = this.state.model;
    const { width, height, className, extraClass, style } = this.props;
    const { active, range } = this.state;
    const ssize = height;
    const value = this.props.value != null ? this.props.value : this.state.value;
    const rrange = model.getRangeForRender(width, range);
    const pos = model.getPositionForRender(width, value);
    return (
      <div
        ref={this.ref}
        className={cn(className || classes.rangeSlider, extraClass)}
        style={{ ...style, height }} onMouseDown={this.onSeek}
      >
        <div
          className={cn(classes.thumbRange, active == 'thumb' && classes.active)}
          style={{ left: 0, width, borderRadius: ssize / 2, pointerEvents: this.props.dragThumb === false ? 'none' : null }}
          onMouseDown={this.onMouseDownThumb}
        />
        {(this.props.onSeeked || this.props.onSeek) &&
          <div className={cn(classes.thumb)} style={{ left: 0, width: pos, backgroundColor: 'red', borderRadius: `${ssize / 2}px 0px 0px ${ssize / 2}px` }}/>
        }
        <div className={cn(classes.thumb)} style={{ left: 0, width: rrange.from + ssize / 2, opacity: 0.6, backgroundColor: 'white' }}/>
        <div className={cn(classes.thumb)} style={{ left: rrange.to + ssize + ssize / 2, right: 0, opacity: 0.6, backgroundColor: 'white' }}/>
        <div
          className={cn(classes.slider, classes.sliderLeft, active == 'left' && classes.active)}
          style={{ left: rrange.from, height: ssize, width: ssize, top: height / 2 - ssize / 2, borderRadius: ssize / 2 }}
          onMouseDown={evt => this.onMouseDown(evt, 'from')}
        />
        <div
          className={cn(classes.slider, classes.sliderRight, active == 'right' && classes.active)}
          style={{ right: (width - ssize * 2) - rrange.to, height: ssize, width: ssize, top: height / 2 - ssize / 2, borderRadius: ssize / 2 }}
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
