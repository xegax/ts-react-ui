import * as React from 'react';
import { FitToParent } from './fittoparent';
import { CheckIcon } from './checkicon';
import { EditValue, Timeline, Range, Tag } from './timeline';
import { VolumeBar } from './volume-bar';
import { clamp, clone } from './common/common';
import { startDragging, isDragging } from './common/start-dragging';
import { Rect } from './common/rect';
import { showModal } from './show-modal';
import { Dialog } from './blueprint';
import { CSSIcon } from './cssicon';

export { Range };

interface CropProps {
  rect: Rect;
  onChanged?(rect: Rect): void;

  width?: number;
  height?: number;

  videoWidth?: number;
  videoHeight?: number;
}

interface CropState {
  rect?: Partial<Rect>;
}

class CropCtrl extends React.Component<CropProps, CropState> {
  state: CropState = {};

  getRect(s?: number): Rect {
    s = s || this.getScale();

    const rect = {
      x: 0,
      y: 0,
      width: this.props.videoWidth,
      height: this.props.videoHeight,
      ...this.props.rect,
      ...this.state.rect
    };

    return {
      x: s * rect.x,
      y: s * rect.y,
      width: s * rect.width,
      height: s * rect.height
    };
  }

  getScale(): number {
    return Math.min(
      this.props.width / this.props.videoWidth,
      this.props.height / this.props.videoHeight
    );
  }

  resizeRB = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const s = this.getScale();
    const orig = this.getRect(1);
    startDragging({ x: 0, y: 0 }, {
      onDragging: evt => {
        const rect = {
          width: Math.round(clamp(orig.width + evt.x / s, [8, this.props.videoWidth - orig.x])),
          height: Math.round(clamp(orig.height + evt.y / s, [8, this.props.videoHeight - orig.y]))
        };
        this.setState({ rect });
      },
      onDragEnd: () => {
        this.props.onChanged && this.props.onChanged({ ...this.props.rect, ...this.state.rect });
        this.setState({ rect: null });
      }
    })(e.nativeEvent);
  }

  drag = (e: React.MouseEvent) => {
    const s = this.getScale();
    const orig = this.getRect(1);
    startDragging({ x: 0, y: 0 }, {
      onDragging: evt => {
        const rect = {
          x: Math.round(clamp(orig.x + evt.x / s, [0, this.props.videoWidth - orig.width])),
          y: Math.round(clamp(orig.y + evt.y / s, [0, this.props.videoHeight - orig.height]))
        };
        this.setState({ rect });
      },
      onDragEnd: () => {
        this.props.onChanged && this.props.onChanged({ ...this.props.rect, ...this.state.rect });
        this.setState({ rect: null });
      }
    })(e.nativeEvent);
  }

  render() {
    const { width, height, videoWidth, videoHeight } = this.props;
    if (!videoWidth || !videoHeight)
      return null;

    const s = this.getScale();
    const left = (width - videoWidth * s) / 2;
    const top = (height - videoHeight * s) / 2;

    const rect = this.getRect(s);
    rect.x += left;
    rect.y += top;

    const style: React.CSSProperties = {
      position: 'absolute',
      left: rect.x,
      top: rect.y,
      width: rect.width,
      height: rect.height,
      backgroundColor: 'white',
      opacity: 0.5
    };

    return (
      <div style={style} onMouseDown={this.drag}>
        <div
          style={{ bottom: 0, right: 0, position: 'absolute', width: 5, height: 5, cursor: 'se-resize' }}
          onMouseDown={this.resizeRB}
        />
      </div>
    );
  }
}


export interface VideoData {
  src: string;
  trim?: Range;
  crop?: Rect;
}

export interface CtrlData {
  volume?: number;
  loop?: boolean;
}

interface Props {
  width?: number;
  height?: number;

  data: VideoData; // object will not be changed
  ctrl?: CtrlData;

  onChangedData?(data: VideoData): void;
  onChangedCtrl?(ctrl: CtrlData): void;

  showToolbar?: boolean;
  toolbar?: Array<JSX.Element>;
  tags?: Array<React.ReactElement<Tag>>;
  autoPlay?: boolean;
}

interface State {
  time?: number;
  range?: Range;

  data: VideoData;
  origData?: VideoData;

  ctrl: CtrlData;
  origCtrl?: CtrlData;

  ref?: React.RefObject<HTMLVideoElement>;
}

export class Video extends React.Component<Props, State> {
  static defaultProps: Partial<Props> = {
    showToolbar: false
  };

  private ref = React.createRef<HTMLVideoElement>();

  constructor(props: Props) {
    super(props);

    this.state = {
      ref: this.ref,
      data: clone(props.data),
      origData: props.data,
      ctrl: {
        volume: 1,
        ...props.ctrl
      },
      origCtrl: props.ctrl
    };
  }

  static getDerivedStateFromProps(props: Props, state: State) {
    let s: Partial<State>;

    if (state.origData != props.data) {
      let v: VideoData = clone(props.data);
      s = {
        ...s,
        data: v,
        origData: props.data
      };

      if (!v.trim) {
        v.trim = null;
      } else {
        s.time = v.trim.from || 0;
        state.ref.current && (state.ref.current.currentTime = s.time);
      }
    }

    if (state.origCtrl != props.ctrl) {
      s = {
        ...s,
        ctrl: { ...props.ctrl },
        origCtrl: props.ctrl
      };
    }

    return s;
  }

  componentDidMount() {
    const video = this.ref.current;

    video.addEventListener('loadedmetadata', () => {
      this.setState({});
      video.volume = this.state.ctrl.volume;
      video.currentTime = this.state.time || 0;
      if (this.props.autoPlay)
        video.play();
    });

    video.addEventListener('timeupdate', () => {
      if (!video.paused) {
        const trim = this.state.data.trim || { from: 0, to: video.duration };
        if (video.currentTime >= trim.to)
          this.onPlayEnded();
      }
      this.setState({ time: video.currentTime });
    });

    video.addEventListener('ended', evt => {
      if (!isDragging())
        this.onPlayEnded();
    });
  }

  onPlayEnded(): void {
    const video = this.ref.current;
    const trim = this.state.data.trim || { from: 0, to: video.duration };
    if (this.state.ctrl.loop) {
      video.currentTime = trim.from;
      video.play();
    } else {
      video.pause();
      video.currentTime = trim.to;
    }
  }

  getData(): VideoData {
    return clone(this.state.data);
  }

  getRange(): Range {
    if (!this.state.range)
      return { from: 0, to: this.ref.current.duration };
    return this.state.range;
  }

  getTrim(): Range {
    return this.state.data.trim || { from: 0, to: this.ref.current.duration };
  }

  setLoop = (loop: boolean) => {
    this.state.ctrl.loop = loop;
    this.props.onChangedCtrl && this.props.onChangedCtrl({ ...this.state.ctrl });
    this.setState({});
  };

  setVolume = (volume: number) => {
    this.state.ctrl.volume = volume;
    this.props.onChangedCtrl && this.props.onChangedCtrl({ ...this.state.ctrl });
    this.setState({});
  };

  setTrim(trim: Range) {
    this.state.data.trim = trim;
    this.props.onChangedData && this.props.onChangedData(clone(this.state.data));
    this.setState({});
  }

  setCrop = (crop: Rect) => {
    this.state.data.crop = crop;
    this.props.onChangedData && this.props.onChangedData(clone(this.state.data));
    this.setState({});
  }

  renderTags(): Array<React.ReactElement<Tag>> {
    const video = this.ref.current;
    const crop = this.state.data.crop;
    return [
      crop && <Tag
        show={crop != null}
        color='#f0f0f0'
        icon='fa fa-crop'
        onRemove={() => this.setCrop(null)}
      >
        <span>x: </span>
        <EditValue
          value={'' + crop.x}
          onChange={v => {
            let x = clamp(+v, [0, video.videoWidth - crop.width]);
            if (Number.isNaN(x) || x == crop.x)
            return this.setState({});
            this.setCrop({...crop, x});
          }}
        />
        <span> y: </span>
        <EditValue
          value={'' + crop.y}
          onChange={v => {
            let y = clamp(+v, [0, video.videoHeight - crop.height]);
            if (Number.isNaN(y) || y == crop.y)
              return this.setState({});
            this.setCrop({...crop, y});
          }}
        />
        <span> w: </span>
        <EditValue
          value={'' + crop.width}
          onChange={v => {
            let width = clamp(+v, [8, video.videoWidth - crop.x]);
            if (Number.isNaN(width) || width == crop.width)
              return this.setState({});
            this.setCrop({...crop, width});
          }}
        />
        <span> h: </span>
        <EditValue
          value={'' + crop.height}
          onChange={v => {
            let height = clamp(+v, [8, video.videoHeight - crop.y]);
            if (Number.isNaN(height) || height == crop.height)
              return this.setState({});
            this.setCrop({...crop, height});
          }}
        />
      </Tag>,
      ...(this.props.tags || [])
    ].filter(v => v) as any;
  }

  private renderToolbar() {
    const video = this.ref.current;
    if (!video || this.props.showToolbar === false)
      return null;

    return (
      <div className='horz-panel-1' style={{ paddingBottom: 5 }}>
        <CheckIcon
          title='Loop'
          value={this.state.ctrl.loop}
          faIcon='fa fa-refresh'
          onChange={this.setLoop}
        />
        <CheckIcon
          title='Zoom cut'
          value
          faIcon='fa fa-cut'
          onChange={() => {
            if (this.state.range) {
              this.setState({ range: null });
            } else {
              const trim = this.state.data.trim;
              const time = clamp(this.state.time, [trim.from, trim.to]);
              this.setState({
                time,
                range: { ...trim }
              });
              video.currentTime = time;
            }
          }}
        />
        <CheckIcon
          title='Trim start'
          value
          faIcon='fa fa-step-forward'
          onChange={() => {
            const trim: Range = { ...this.state.data.trim };
            trim.from = this.state.time;
            if (trim.to == null)
              trim.to = this.getRange().to;

            this.state.data.trim = trim;
            this.setState({});
          }}
        />
        <CheckIcon
          title='Trim end'
          value
          faIcon='fa fa-step-backward'
          onChange={() => {
            const trim: Range = { ...this.state.data.trim };
            trim.to = this.state.time;
            if (trim.from == null)
              trim.from = this.getRange().from;

            this.state.data.trim = trim;
            this.setState({});
          }}
        />
        <CheckIcon
          title='Crop'
          value={!!this.state.data.crop}
          faIcon='fa fa-crop'
          onChange={() => {
            if (this.state.data.crop) {
              this.setCrop(null);
            } else {
              this.setCrop({
                x: 0,
                y: 0,
                width: video.videoWidth,
                height: video.videoHeight
              });
            }
          }}
        />
        {(this.props.toolbar || []).map((tool, i: number) => {
          return React.cloneElement(tool, { key: tool.key || i });
        })}
      </div>
    );
  }

  renderControl() {
    const video = this.ref.current;
    if (!video)
      return null;

    const range = this.getRange();
    return (
      <div style={{ padding: 5, backgroundColor: 'white' }}>
        {this.renderToolbar()}
        <Timeline
          value={video.currentTime}
          minValue={range.from}
          maxValue={range.to}
          trim={this.state.data.trim}
          tags={this.renderTags()}
          left={[
            <CheckIcon
              value
              faIcon='fa fa-play'
              onChange={() => {
                const trim = this.getTrim();
                if (Math.abs(video.currentTime - trim.to) < 0.001)
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
              value={this.state.ctrl.volume}
              onChanging={this.setVolume}
              onChanged={this.setVolume}
            />
          ]}
          onChangingValue={time => {
            this.setState({ time });
            this.ref.current.currentTime = time;
          }}
          onChangedValue={time => {
            this.setState({ time });
            this.ref.current.currentTime = time;
          }}
          onChangedTrim={(trim: Range) => {
            this.setTrim(trim);
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
    const video = this.ref.current;
    return (
      <div className='abs-fit-noscroll'>
        <video
          ref={this.ref}
          src={this.props.data.src}
          width={width}
          height={height}
        />
        {video && this.state.data.crop && <CropCtrl
          videoWidth={video.videoWidth}
          videoHeight={video.videoHeight}
          width={width}
          height={height}
          rect={this.state.data.crop}
          onChanged={this.setCrop}
        />}
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

export function showVideo(args: { src: string }) {
  const dlg = showModal(
    <Dialog
      style={{ width: 'unset', padding: 0 }}
      canEscapeKeyClose
      canOutsideClickClose
      isOpen
      isCloseButtonShown
      onClose={() => dlg.close()}
    >
      <div
        className='abs-fit-noscroll'
        style={{ pointerEvents: 'none', display: 'flex' }}
      >
        <video
          src={args.src}
          controls
          autoPlay
          style={{ pointerEvents: 'initial', objectFit: 'scale-down', width: '100%' }}
        />
        <CSSIcon
          title='Close'
          icon='fa fa-close'
          style={{ position: 'absolute', right: 5, top: 5, fontSize: '24pt', pointerEvents: 'initial' }}
          onClick={() => dlg.close()}
        />
      </div>
    </Dialog>
  );
}
