import * as React from 'react';
import { storiesOf } from '@storybook/react';
import '../src/_base.scss';
import { Tabs, Tab } from '../src/tabs';
import { CSSIcon } from '../src/cssicon';

class Dummy extends React.Component {
  state = { select: '' };

  render() {
    return (
      <div>
        <div>
          <Tabs defaultSelect='3' onSelect={select => this.setState({select})}>
            <Tab label='tab 1111 111 11' id='1'/>
            <Tab label='tab 2' id='2'/>
            <Tab icon='fa fa-trash' label='tab 333 333 33333 33333 3333 33333 3333' id='3'/>
            <Tab label='tab 4' id='4'/>
            <Tab label='tab 5' id='5'/>
            <Tab label='tab 6' id='6'/>
          </Tabs>
        </div>
        <div style={{marginTop: 10}}>
          <Tabs select={this.state.select} width={100}>
            <Tab label='tab 1' id='1'/>
            <Tab label='tab 2' id='2'/>
            <Tab label='tab 3' id='3'/>
            <Tab label='tab 4' id='4'/>
            <Tab label='tab 5' id='5'/>
            <Tab label='tab 6' id='6'/>
          </Tabs>
        </div>
        <div style={{marginTop: 10}}>
          <Tabs select={this.state.select} disabled>
            <Tab label='tab 1' id='1'/>
            <Tab label='tab 2' id='2'/>
            <Tab label='tab 3' id='3'/>
            <Tab label='tab 4' id='4'/>
            <Tab label='tab 5' id='5'/>
            <Tab label='tab 6' id='6'/>
          </Tabs>
        </div>
      </div>
    );
  }
}

storiesOf('Tabs', module)
  .add('Tab1', () => {
    return (
      <Dummy/>
    );
  });