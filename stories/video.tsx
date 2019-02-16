import * as React from 'react';
import { storiesOf } from '@storybook/react';
import { Video } from '../src/video';
import '../src/_base.scss';

storiesOf('Video', module)
.add('video', () => {
  return (
    <div className='abs-fit flex'>
      <Video src='contra.mp4'/>
    </div>
  );
});
