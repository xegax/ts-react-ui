import * as React from 'react';
import { FitToParent } from './fittoparent';
import { Slider } from './slider';
import { CheckIcon } from './checkicon';
import { Textbox } from './textbox';

interface Props {
  src: string;
  width?: number;
  height?: number;
}

export class Video extends React.Component<Props> {
  private ref = React.createRef<HTMLVideoElement>();

  componentDidMount() {
    this.ref.current.addEventListener('loadedmetadata', () => {
      this.setState({});
    });

    this.ref.current.addEventListener('timeupdate', () => {
      this.setState({});
    });
  }

  renderControl() {
    const video = this.ref.current;
    if (!video)
      return null;

    return (
      <div className='flexcol1' style={{padding: 5}}>
        <div className='flexrow1 horz-panel-1'>
          <CheckIcon
            value
            faIcon={video.paused ? 'fa fa-play' : 'fa fa-stop'}
            onChange={() => {
              if (video.paused)
                video.play();
              else
                video.pause();
              this.setState({});
            }}
          />
          <Slider
            wrapToFlex
            height={20}
            min={0}
            max={video.duration}
            value={video.currentTime}
            onChange={v => {
              this.ref.current.currentTime = v;
              this.setState({});
            }}
          />
        </div>
        <div>
          <div style={{backgroundColor: 'silver', borderRadius: 3, padding: 2, display: 'inline-block'}}>
            cut: <Textbox value='0' width={50}/> - <Textbox value={'' + video.duration} width={50}/>
          </div>
          {video.currentTime} ({video.duration})
        </div>
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
        <div style={{ color: 'white' }}>
          {this.renderControl()}
        </div>
      </div>
    );
  }
}
