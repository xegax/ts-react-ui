import * as React from 'react';
import { storiesOf } from '@storybook/react';
import { AppCompLayout, AppComponent, AppContent } from '../src/app-comp-layout';
import '../src/_base.scss';

const classes = {
  vertRootBar: 'vert-root-bar',
  iconBar: 'icon-bar',
  iconButton: 'icon-button',
  content: 'icon-bar-content',
  contentWrap: 'icon-bar-content-wrap'
};

class Dummy extends React.Component {
  render() {
    return (
      <AppCompLayout defaultSelect='file'>
        <AppComponent faIcon='fa fa-file-o' id='file'>
          <div style={{width: 200}}>
            this file settings
          </div>
        </AppComponent>
        <AppComponent faIcon='fa fa-rocket' id='rocket'>
          <div style={{width: 200}}>
            rocket options
          </div>
        </AppComponent>
        <AppComponent faIcon='fa fa-taxi' id='taxi'>
        </AppComponent>
        <AppContent>
          <div className='flex1' style={{backgroundColor: 'white'}}>
          </div>
        </AppContent>
      </AppCompLayout>
    );
  }
}

storiesOf('App layout', module)
  .add('App layout', () => {
    return (
      <Dummy/>
    );
  });