import * as React from 'react';
import { startDragging } from './common/start-dragging';
import { FitToParent } from './fittoparent';
import { clamp, className as cn } from './common/common';

const classes = {
  container: 'timeline-container',
  timeline: 'timeline',
  timeValue: 'time-value',
  timeSlider: 'time-slider',
  trim: 'trim',
  trimLeft: 'trim-left',
  trimRight: 'trim-right',
  text: 'time-text',
  leftAlign: 'leftalign-text',
  rightAlign: 'rightalign-text',
  tag: 'timeline-tag',
  details: 'timeline-details'
};

export interface Range {
  from: number;
  to: number;
}

interface Props {
  height?: number;
  width?: number;

  minValue: number;
  maxValue: number;
  value: number;
  trim?: Range;

  onChangingValue?(value: number): void;
  onChangedValue?(value: number): void;

  onChangedTrim?(trim: Partial<Range>): void;
  onChangingTrim?(trim: Partial<Range>): void;
}

interface State {
  value: number;
  trim: Range;
}

class EditValue extends React.Component<{value: string}> {
  render() {
    return (
      <input
        style={{
          textAlign: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          outline: 'none',
          width: (this.props.value.length - 2) + 'em',
          font: 'inherit'
        }}
        value={this.props.value}
      />
    );
  }
}

class TimelineImpl extends React.Component<Props, Partial<State>> {
  static defaultProps: Partial<Props> = {
    height: 20
  };
  state: Partial<State> = {};
  timeline = React.createRef<HTMLDivElement>();

  getValueToRender(value?: number): number {
    if (value == null)
      value = this.state.value != null ? this.state.value : this.props.value;

    const valLen = this.props.maxValue - this.props.minValue;
    return this.props.minValue + (this.props.width / valLen) * value || 0;
  }

  getValueFromRender(rpos: number): number {
    const valLen = this.props.maxValue - this.props.minValue;
    let value = (rpos - this.props.minValue) * ( valLen / this.props.width );
    return clamp(value, [this.props.minValue, this.props.maxValue]);
  }

  private onTimelineMouseDown = (e: React.MouseEvent) => {
    const bbox = this.timeline.current.getBoundingClientRect();
    const rpos = e.pageX - bbox.left;
    startDragging({ x: 0, y: 0}, {
      onDragging: evt => {
        this.onChangingValue(this.getValueFromRender(rpos + evt.x));
      },
      onDragEnd: evt => {
        this.onChangedValue(this.getValueFromRender(rpos + evt.x));
      }
    })(e.nativeEvent);
  };

  private onTimeValueMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const rpos = this.getValueToRender();
    startDragging({x: rpos, y: 0}, {
      onDragging: evt => {
        this.onChangingValue(this.getValueFromRender(evt.x));
      },
      onDragEnd: evt => {
        this.onChangedValue(this.getValueFromRender(evt.x));
      }
    })(e.nativeEvent);
  };

  private onDragLeftTrim(e: React.MouseEvent, left: number) {
    e.stopPropagation();
    e.preventDefault();

    const trim = this.getValueToRender(left);
    startDragging({x: trim, y: 0}, {
      onDragging: evt => {
        document.body.style.cursor = 'w-resize';
        this.onChangingTrim({from: this.getValueFromRender(evt.x)});
      },
      onDragEnd: evt => {
        document.body.style.cursor = null;
        this.onChangedTrim({from: this.getValueFromRender(evt.x)});
      }
    })(e.nativeEvent);
  };

  private onDragRightTrim(e: React.MouseEvent, right: number) {
    e.stopPropagation();
    e.preventDefault();

    const trim = this.getValueToRender(right);
    startDragging({x: trim, y: 0}, {
      onDragging: evt => {
        document.body.style.cursor = 'w-resize';
        this.onChangingTrim({to: this.getValueFromRender(evt.x)});
      },
      onDragEnd: evt => {
        document.body.style.cursor = null;
        this.onChangedTrim({to: this.getValueFromRender(evt.x)});
      }
    })(e.nativeEvent);
  };

  private onChangingTrim(trim: Partial<Range>) {
    if (trim)
      trim = {...trim};

    if (this.props.onChangingTrim)
      this.props.onChangingTrim(trim);

    if (trim && trim.from == null)
      trim.from = this.props.trim ? this.props.trim.from : this.props.minValue;

    if (trim && trim.to == null)
      trim.to = this.props.trim ? this.props.trim.to : this.props.maxValue;

    this.setState({ trim: trim as Range });
  }

  private onChangedTrim(trim: Partial<Range>) {
    if (trim)
      trim = {...trim};

    if (trim && trim.from == null)
      trim.from = this.props.trim ? this.props.trim.from : this.props.minValue;

    if (trim && trim.to == null)
      trim.to = this.props.trim ? this.props.trim.to : this.props.maxValue;

    if (trim && trim.from > trim.to) {
      const tmp = trim.from;
      trim.from = trim.to;
      trim.to = tmp;
    }

    if (this.props.onChangedTrim)
      this.props.onChangedTrim(trim);
    this.setState({ trim: null });
  }

  private onChangingValue(newValue: number) {
    if (this.props.onChangingValue)
      this.props.onChangingValue(newValue);
    else
      this.setState({ value: newValue });
  }

  private onChangedValue(newValue: number) {
    if (this.props.onChangedValue)
      this.props.onChangedValue(newValue);
    this.setState({ value: null });
  }

  renderTrim() {
    const { height, trim: ptrim } = this.props;
    const { trim: strim } = this.state;

    let trim: Range = { from: this.props.minValue, to: this.props.maxValue };
    if (strim && strim.from != null)
      trim.from = strim.from;
    else if (ptrim && ptrim.from != null)
      trim.from = ptrim.from;

    if (strim && strim.to != null)
      trim.to = strim.to;
    else if (ptrim && ptrim.to != null)
      trim.to = ptrim.to;

    return (
      <>
        <div className={classes.trim} style={{ height, left: 0, width: this.getValueToRender(trim.from) }}>
          <div
            className={classes.trimLeft}
            style={{ height }}
            onMouseDown={e => this.onDragLeftTrim(e, trim.from)}
          />
        </div>
        <div className={classes.trim} style={{ height, left: this.getValueToRender(trim.to), right: 0 }}>
          <div
            className={classes.trimRight}
            style={{ height }}
            onMouseDown={e => this.onDragRightTrim(e, trim.to)}
          />
        </div>
      </>
    );
  }

  renderTimeValue(t: number): string {
    return Math.floor(t * 1000) / 1000 + '';
  }

  renderTimeline() {
    const { height } = this.props;

    return (
      <div
        ref={this.timeline}
        className={classes.timeline}
        style={{ height }}
        onMouseDown={this.onTimelineMouseDown}
      >
        <div
          className={classes.timeValue}
          style={{height, left: this.getValueToRender()}}
        >
          <div className={classes.timeSlider} onMouseDown={this.onTimeValueMouseDown}/>
        </div>
        {this.renderTrim()}
        <div className={cn(classes.leftAlign, classes.text)}>
          {this.renderTimeValue(this.props.minValue)}
        </div>
        <div className={cn(classes.rightAlign, classes.text)}>
          {this.renderTimeValue(this.props.maxValue)}
        </div>
      </div>
    );
  }

  getTrimFrom() {
    if (this.state.trim)
      return this.state.trim.from;

    if (this.props.trim)
      return this.props.trim.from;

    return this.props.minValue;
  }

  getTrimTo() {
    if (this.state.trim)
      return this.state.trim.to;

    if (this.props.trim)
      return this.props.trim.to;

    return this.props.maxValue;
  }

  renderDetails() {
    return (
      <div className={classes.details}>
        <Tag
          show={!!(this.props.trim || this.state.trim)}
          icon='fa fa-cut'
          onRemove={() => this.onChangedTrim(null)}
        >
          <>
            <EditValue value={this.renderTimeValue(this.getTrimFrom())}/> - <EditValue value={this.renderTimeValue(this.getTrimTo())}/>
            ({this.renderTimeValue(this.getTrimTo() - this.getTrimFrom())})
          </>
        </Tag>
      </div>
    );
  }

  render() {
    return (
      <div className={classes.container}>
        {this.renderTimeline()}
        {this.renderDetails()}
      </div>
    );
  }
}

interface TagProps {
  show?: boolean;
  icon?: string;
  onRemove?(): void;
  children?: React.ReactChild;
}

function Tag(props: TagProps) {
  return props.show == true && (
    <div className={classes.tag}>
      <i className={props.icon}/>
      {props.children}
      <i style={{cursor: 'pointer'}} className='fa fa-remove' onClick={props.onRemove}/>
    </div>
  );
}

export function Timeline(props: Props) {
  return (
    <FitToParent
      render={w => {
        return (
          <TimelineImpl
            width={w}
            {...props}
          />
        );
      }}
    />
  );
}