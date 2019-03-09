import * as React from 'react';
import { storiesOf } from '@storybook/react';
import { Video, VideoData, CtrlData } from '../src/video';
import { CheckIcon } from '../src/checkicon';
import { DropDown } from '../src/drop-down';
import '../src/_base.scss';

interface State {
  data: VideoData;
  ctrl: CtrlData;
}

let cuts: Array<VideoData> = [
  {
    src: 'contra.mp4',
    trim: { from: 0, to: 3 }
  }, {
    src: 'contra.mp4',
    trim: { from: 4, to: 5 }
  }, {
    src: 'contra.mp4'
  }, {
    src: 'contra.mp4',
    trim: { from: 8, to: 10 }
  }
];

class Dummy extends React.Component<{}, State> {
  state: State = {
    data: null,
    ctrl: { volume: 0.5 }
  };

  render() {
    return (
      <div className='abs-fit flexcol'>
        <div className='flexrow horz-panel-1' style={{justifyItems: 'center', padding: 5 }}>
          <span>video:</span>
          <DropDown
            width={100}
            values={cuts.map((v, i) => {
              return { value: '' + i, render: v.src + ', ' + (i + 1) };
            })}
            onSelect={video => {
              this.setState({ data: cuts[+video.value] });
            }}
          />
        </div>
        <div style={{position: 'relative', flexGrow: 1}}>
          {this.state.data && 
            <Video
              ctrl={this.state.ctrl}
              data={this.state.data}

              onChangedCtrl={ctrl => {
                this.setState({ ctrl });
              }}

              toolbar={[
                <CheckIcon value faIcon='fa fa-plus' />
              ]}
            />}
        </div>
      </div>
    );
  }
}

storiesOf('Video', module)
.add('video', () => {
  return (
    <Dummy/>
  );
});
