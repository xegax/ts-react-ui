import * as React from 'react';
import { storiesOf } from '@storybook/react';
import { Timeline, Range, Tag, TagProps, EditValue } from '../src/timeline';
import { Rect } from '../src/common/rect';
import '../src/_base.scss';
import { clamp } from '../src/common/common';
import { startDragging, isDragging } from '../src/common/start-dragging';
import { VolumeBar } from '../src/volume-bar';

interface State {
  trim: Range;
  value: number;
  crop?: Rect;
  range?: Array<number>,
  volume: number;
}

class Dummy extends React.Component<{}, Partial<State>> {
  state: Partial<State> = {
    value: 25,
    crop: { x: 0, y: 0, width: 320, height: 240 },
    volume: 0.5
  };

  renderCrop() {
    if (!this.state.crop)
      return null;

    return (
      <Tag
        icon='fa fa-crop'
        color='#DDFFDE'
        onRemove={() => {
          this.setState({ crop: null });
        }}
      >
        <span>x: </span><EditValue value={'' + this.state.crop.x} onChange={v => {
          this.state.crop.x = +v;
          this.setState({});
        }} />
        <span> y: </span><EditValue value={'' + this.state.crop.y} onChange={v => {
          this.state.crop.y = +v;
          this.setState({});
        }} />
        <span> w: </span><EditValue value={'' + this.state.crop.width} onChange={v => {
          this.state.crop.width = +v;
          this.setState({});
        }} />
        <span> h: </span><EditValue value={'' + this.state.crop.height} onChange={v => {
          this.state.crop.height = +v;
          this.setState({});
        }} />
      </Tag>
    );
  }

  render() {
    return (
      <div style={{marginTop: 100}}>
        <div>
          <i
            className='fa fa-cut'
            onClick={() => {
              if (this.state.range)
                this.setState({range: null});
              else {
                const trim = this.state.trim;
                this.setState({range: [trim.from, trim.to], value: clamp(this.state.value, [trim.from, trim.to]) });
              }
            }}
          />
        </div>
        <Timeline
          height={20}
          minValue={this.state.range ? this.state.range[0] : 0}
          maxValue={this.state.range ? this.state.range[1] : 50}
          trim={this.state.trim}
          value={this.state.value}
          right={[
            <VolumeBar
              height={60}
              value={this.state.volume}
              onChanging={volume => {
                this.setState({ volume });
              }}
              onChanged={volume => {
                this.setState({ volume });
              }}
            />
          ]}
          onChangingTrim={trim => {
            if (trim.from != null)
              this.setState({ value: trim.from });
            else if (trim.to != null)
              this.setState({ value: trim.to });
          }}
          onChangedTrim={(trim: Range) => {
            this.setState({ trim });
          }}
          onChangingValue={value => {
            this.setState({ value });
          }}
          onChangedValue={value => {
            this.setState({ value });
          }}
          tags={[this.renderCrop()].filter(v => v)}
        />
      </div>
    );
  }
}

storiesOf('Timeline', module)
  .add('Timeline', () => {
    return (
      <Dummy />
    );
  });