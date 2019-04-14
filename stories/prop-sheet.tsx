import * as React from 'react';
import { storiesOf } from '@storybook/react';
import {
  PropSheet,
  PropsGroup,
  PropItem,
  TextPropItem,
  DropDownPropItem,
  SliderPropItem,
  SwitchPropItem
} from '../src/prop-sheet';
// import { prompt } from '../src/prompt';
import { Item, DropDown } from '../src/drop-down';
import { Publisher } from 'objio';
import { clamp } from '../src/common/common';
import { ListView } from '../src/list-view';
import { Timer } from 'objio/common/timer';
import { Tabs, Tab } from '../src/tabs';
import { Popover, Classes } from '../src/popover';

class Model extends Publisher {
  private id: string = '4215';
  private name: string = 'sprite 1';
  private show: boolean = true;
  private select: Item;
  private frame: number = 0;
  private minMaxFrame = [0, 10];
  private on: boolean = true;
  private playing: boolean = false;
  private timer2 = new Timer(() => {
    if (!this.playing)
      return;
    this.setFrame((this.frame + 1) % (this.minMaxFrame[1] - this.minMaxFrame[0] + 1));
  }).runRepeat(33);

  private scenes: Array<Item> = [
    {
      value: 'url(https://www.wikipedia.org/portal/wikipedia.org/assets/img/Wikipedia-logo-v2@1.5x.png)',
      render: 'wiki'
    }, {
      value: 'url(https://knigaaudio.online/uploads/images/media/71/O7RdJuL8B7SYu0Kz-potter-i-filosofskiy-kamen.jpg)',
      render: 'гарри'
    }, {
      value: 'url(https://st.kp.yandex.net/images/film_iphone/iphone360_926540.jpg)',
      render: 'Mission: Imposible - Fallout'
    }, {
      value: 'url(https://st.kp.yandex.net/images/film_iphone/iphone360_988782.jpg)',
      render: 'Ральф против интернета'
    }
  ];

  getID(): string {
    return this.id;
  }

  isOn(): boolean {
    return this.on;
  }

  setOn(on: boolean) {
    this.on = on;
    this.delayedNotify();
  }

  setName(name: string) {
    if (this.name == name)
      return;

    this.name = name;
    this.delayedNotify();
  }

  getName(): string {
    return this.name;
  }

  setShow(show: boolean) {
    if (this.show == show)
      return;

    this.show = show;
    this.delayedNotify();
  }

  getShow(): boolean {
    return this.show;
  }

  getScenes() {
    return this.scenes;
  }

  addScene(name: string) {
    this.scenes.push({ value: name });
    this.delayedNotify();
  }

  removeScene(n: number) {
    this.scenes.splice(n);
    this.delayedNotify();
  }

  setImage(scene: Item) {
    this.select = scene;
    this.delayedNotify();
  }

  getSelectImage(): Item {
    return this.select;
  }

  getFrameMin() {
    return this.minMaxFrame[0];
  }

  getFrameMax() {
    return this.minMaxFrame[1];
  }

  getFrame() {
    return this.frame;
  }

  setFrame(value: number) {
    this.frame = clamp(value, this.minMaxFrame);
    this.notify();
  }

  togglePlay() {
    this.playing = !this.playing;
    this.notify();
  }

  isPlaying() {
    return this.playing;
  }
}

class View extends React.Component<{ model: Model, defaultWidth?: number, fitToAbs?: boolean }, { width: number }> {
  state = {
    width: 200
  };

  subscriber = () => {
    this.setState({});
  }

  componentDidMount() {
    this.props.model.subscribe(this.subscriber);
  }

  componentWillUnmount() {
    this.props.model.unsubscribe(this.subscriber);
  }

  group1() {
    return (
      <PropsGroup label='object'>
        <Tabs defaultSelect='t1'>
          <Tab label='tab 1 1 1 1 1 1' id='t1'>
            <SwitchPropItem
              label='on'
              value={model.isOn()}
              onChanged={v => model.setOn(v)}
            />
            <PropItem label='id' value={model.getID()} />
            <SliderPropItem
              label='frame'
              round
              min={model.getFrameMin()}
              max={model.getFrameMax()}
              value={model.getFrame()}
              onChanged={value => model.setFrame(value)}
              onChange={value => model.setFrame(value)}
            />
            <SliderPropItem
              inline={false}
              label='frame'
              min={model.getFrameMin()}
              max={model.getFrameMax()}
              value={model.getFrame()}
              onChanged={value => model.setFrame(value)}
              onChange={value => model.setFrame(value)}
              left={[
                <i
                  className={model.isPlaying() ? 'fa fa-pause' : 'fa fa-play'}
                  title='play'
                  onClick={e => model.togglePlay()}
                />
              ]}
            />
            <TextPropItem
              label='frame'
              value={model.getFrame()}
              onChanged={value => model.setFrame(+value)}
            />
          </Tab>
          <Tab label='tab 2' id='t2'>
            <TextPropItem
              label='name'
              value={model.getName()}
              onChanged={value => model.setName(value)}
            />
            <TextPropItem
              label='name 2'
              value={model.getName()}
              onChanged={value => model.setName(value)}
            />
          </Tab>
          <Tab label='tab 3' id='t3'>
            <DropDownPropItem
              label='scenes 1 2 3 4'
              inline={false}
              values={model.getScenes()}
              value={model.getSelectImage()}
              onSelect={scene => model.setImage(scene)}
            />
            <DropDownPropItem
              label='scenes'
              values={model.getScenes()}
              value={model.getSelectImage()}
              onSelect={scene => model.setImage(scene)}
            />
            <PropItem label='scenes' inline={false}>
              <ListView values={model.getScenes()} />
            </PropItem>
          </Tab>
        </Tabs>
      </PropsGroup>
    );
  }

  group2() {
    return (
      <PropsGroup label='table' defaultHeight={200} flex>
        <DropDown
          values={[]}
        />
        <ListView
          height={0}
          style={{ flexGrow: 1 }}
          border={false}
          header={{ value: 'columns' }}
          values={new Array(10).fill(null).map((v, i) => ({ value: 'col ' + i }))}
        />
        <div style={{ textAlign: 'right' }}>
          <Popover>
            <button>popper</button>
            <ListView
              itemClassName={Classes.POPOVER_DISMISS}
              border={false}
              values={new Array(15).fill(null).map((v, i) => ({ value: 'sel ' + i }))}
              height={100}
              width={150}
              onSelect={item => {
                console.log(item);
              }}
            />
          </Popover>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Popover>
            <button>popper 2</button>
            <ListView
              itemClassName={Classes.POPOVER_DISMISS}
              border={false}
              values={new Array(15).fill(null).map((v, i) => ({ value: 'sel ' + i }))}
              height={100}
              width={150}
              onSelect={item => {
                console.log(item);
              }}
            />
          </Popover>
        </div>
      </PropsGroup>
    );
  }

  render() {
    const model = this.props.model;
    const select = model.getSelectImage();
    return (
      <PropSheet defaultWidth={this.props.defaultWidth} fitToAbs={this.props.fitToAbs} resize>
        <PropsGroup label='list'>
          <ListView values={model.getScenes()} />
        </PropsGroup>
        <PropsGroup label='wiki' defaultOpen={false}>
          <div>{select && select.render}</div>
          <div style={{
            height: 200,
            backgroundImage: select && select.value,
            backgroundPosition: 'center',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat'
          }}
          />
        </PropsGroup>
        {this.group2()}
        {this.group1()}
      </PropSheet>
    );
  }
}

let model = new Model();
storiesOf('Prop sheet', module)
  .add('property in abs container', () => {
    return (
      <div style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
        <View model={model} fitToAbs />
      </div>
    );
  })
  .add('property in flex container', () => {
    return (
      <div style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, overflow: 'hidden', display: 'flex' }}>
        <div style={{ position: 'relative', display: 'flex', flexGrow: 1 }}>
          <View model={model} defaultWidth={150} />
          <div style={{ flexGrow: 1, backgroundColor: 'silver', border: '1px solid green', margin: '5px' }}>
          </div>
        </div>
      </div>
    );
  });;