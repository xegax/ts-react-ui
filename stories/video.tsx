import * as React from 'react';
import { storiesOf } from '@storybook/react';
import { Video, Range } from '../src/video';
import { CheckIcon } from '../src/checkicon';
import { DropDown } from '../src/drop-down';
import '../src/_base.scss';

interface Cut {
  video?: string;
  trim?: Range;
}

interface State {
  video?: string;
}

class Dummy extends React.Component<{}, State> {
  state: State = {};

  render() {
    return (
      <div className='abs-fit flexcol'>
        <div className='flexrow horz-panel-1' style={{justifyItems: 'center', padding: 5 }}>
          <span>video:</span>
          <DropDown
            width={100}
            values={[
              { value: 'contra.mp4' },
              { value: 'dance.mp4' }
            ]}
            onSelect={video => {
              this.setState({ video: video.value });
            }}
          />
        </div>
        <div style={{position: 'relative', flexGrow: 1}}>
          {this.state.video && 
            <Video
              key={this.state.video}
              src={this.state.video}
              defaultVolume={0.5}
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
