import * as React from 'react';
import { FitToParent } from './fittoparent';
import { CheckIcon } from './checkicon';
import { Timeline, Range, Tag } from './timeline';
import { VolumeBar } from './volume-bar';
import { clamp } from './common/common';

export { Range };

interface Props {
  src: string;
  width?: number;
  height?: number;
  defaultVolume?: number; // 0 - 1
  defaultTrim?: Range;
  defaultTime?: number;
  toolbar?: Array<JSX.Element>;
  tags?: Array<React.ReactElement<Tag>>;
}

interface State {
  time?: number;
  range?: Range;
  trim?: Range;
  volume?: number;
  loop?: boolean;
}

export class Video extends React.Component<Props, State> {
  private ref = React.createRef<HTMLVideoElement>();
  state: State = {};

  constructor(props: Props) {
    super(props);

    this.state = {
      time: props.defaultTime || 0,
      volume: props.defaultVolume || 1,
      trim: props.defaultTrim
    };
  }

  componentDidMount() {
    const video = this.ref.current;
    video.addEventListener('loadedmetadata', () => {
      this.setState({});
      video.volume = this.state.volume;
      video.currentTime = this.state.time;
    });

    video.addEventListener('timeupdate', () => {
      if (!video.paused) {
        const trim = this.state.trim || { from: 0, to: video.duration };
        if (video.currentTime >= trim.to)
          this.onPlayEnded();
      }
      this.setState({ time: video.currentTime });
    });

    video.addEventListener('ended', evt => {
      this.onPlayEnded();
    });
  }

  onPlayEnded(): void {
    const video = this.ref.current;
    const trim = this.state.trim || { from: 0, to: video.duration };
    if (this.state.loop) {
      video.currentTime = trim.from;
      video.play();
    } else {
      video.pause();
      video.currentTime = trim.to;
    }
  }

  getRange(): Range {
    if (!this.state.range)
      return { from: 0, to: this.ref.current.duration };
    return this.state.range;
  }

  getTrim(): Range {
    return this.state.trim || { from: 0, to: this.ref.current.duration };
  }

  renderControl() {
    const video = this.ref.current;
    if (!video)
      return null;

    const range = this.getRange();
    return (
      <div style={{padding: 5, backgroundColor: 'white'}}>
        <div className='horz-panel-1' style={{paddingBottom: 5}}>
          <CheckIcon
            title='Loop'
            value={this.state.loop}
            faIcon='fa fa-refresh'
            onChange={loop => {
              this.setState({ loop });
            }}
          />
          <CheckIcon
            title='Zoom cut'
            value
            faIcon='fa fa-cut'
            onChange={() => {
              if (this.state.range) {
                this.setState({ range: null });
              } else {
                const trim = this.state.trim;
                const time = clamp(this.state.time, [trim.from, trim.to]);
                this.setState({
                  range: {...trim},
                  time 
                });
                video.currentTime = time;
              }
            }}
          />
          {(this.props.toolbar || []).map((tool, i: number) => {
            return React.cloneElement(tool, { key: tool.key || i });
          })}
        </div>
        <Timeline
          value={video.currentTime}
          minValue={range.from}
          maxValue={range.to}
          trim={this.state.trim}
          tags={this.props.tags}
          left={[
            <CheckIcon
              value
              faIcon='fa fa-play'
              onChange={() => {
                const trim = this.getTrim();
                if (Math.abs(video.currentTime-trim.to) < 0.001 )
                  video.currentTime = trim.from;

                video.paused ? video.play() : video.pause();
              }}
            />,
            <CheckIcon
              value
              faIcon='fa fa-step-forward'
              onChange={() => {
                video.currentTime = this.getTrim().from;
                video.paused ? video.play() : video.pause();
              }}
            />
          ]}
          right={[
            <VolumeBar
              value={this.state.volume}
              onChanging={volume => {
                video.volume = volume;
                this.setState({ volume });
              }}
              onChanged={volume => {
                video.volume = volume;
                this.setState({ volume });
              }}
            />
          ]}
          onChangingValue={time => {
            this.setState({ time });
            video.currentTime = time;
          }}
          onChangedValue={time => {
            this.setState({ time })
            video.currentTime = time;
          }}
          onChangedTrim={(trim: Range) => {
            this.setState({ trim });
          }}
          onChangingTrim={trim => {
            let time = this.state.time;
            if (trim.from != null) {
              time = trim.from;
            } else if (trim.to != null) {
              time = trim.to;
            }
            this.setState({ time });
            video.currentTime = time;
          }}
        />
      </div>
    );
  }

  renderVideo = (width: number, height: number) => {
    return (
      <div className='abs-fit-noscroll'>
        <video
          ref={this.ref}
          src={this.props.src}
          width={width}
          height={height}
        />
      </div>
    );
  }

  render() {
    return (
      <div className='abs-fit-noscroll flexcol1' style={{ backgroundColor: 'black' }}>
        <FitToParent
          wrapToFlex
          render={this.renderVideo}
        />
        {this.renderControl()}
      </div>
    );
  }
}
