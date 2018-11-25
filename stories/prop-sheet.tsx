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
import { Item } from '../src/drop-down';
import { Publisher } from 'objio';
import './layout.scss';
import { clamp } from '../common/common';
import { ListView } from '../src/list-view';

class Model extends Publisher {
  private id: string = '4215';
  private name: string = 'sprite 1';
  private show: boolean = true;
  private select: Item;
  private frame: number = 0;
  private minMaxFrame = [0, 10];
  private on: boolean = true;

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
    console.log(on);
    this.delayedNotify();
  }

  setName(name: string) {
    if (this.name == name)
      return;

    this.name = name;
    console.log(name);
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
}

interface State {
  scene?: string;
}

class View extends React.Component<{ model: Model }, State> {
  subscriber = () => {
    this.setState({});
  }

  componentDidMount() {
    this.props.model.subscribe(this.subscriber);
  }

  componentWillUnmount() {
    this.props.model.unsubscribe(this.subscriber);
  }

  render() {
    const model = this.props.model;
    const select = model.getSelectImage();
    return (
      <div style={{ backgroundColor: 'silver', width: 200 }}>
        <PropSheet>
            <PropsGroup label='root'>
              <PropsGroup label='wiki'>
                <div>{select && select.render}</div>
                <div style={{
                  height: 200,
                  backgroundImage: select && select.value,
                  backgroundPosition: 'center',
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat'}}
                />
              </PropsGroup>
              <PropsGroup label='object' height={300}>
                <SwitchPropItem
                  label='on'
                  value={model.isOn()}
                  onChanged={v => model.setOn(v)}
                />
                <PropItem label='id' value={model.getID()}/>
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
                />
                <TextPropItem
                  label='frame'
                  value={model.getFrame()}
                  onChanged={value => model.setFrame(+value)}
                />
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
                  <ListView values={model.getScenes()}/>
                </PropItem>
              </PropsGroup>
            </PropsGroup>
          </PropSheet>
      </div>
    );
  }
}

let model = new Model();
storiesOf('Prop sheet', module)
  .add('property', () => {
    return (
      <View model={model}/>
    );
  })
  .add('layout', () => {
    return (
      <div className='layout' style={{width: 200}}>
        <div className='item inline'>
          <div className='name-wrap'>name</div>
          <div className='value-wrap'>
            value
          </div>
        </div>
        <div className='item'>
          <div className='name-wrap'>name</div>
          <div className='value-wrap'>
            <div className='fit'>value xxx yyy zzz ddd fff  ggg hhh rtrtert</div>
          </div>
        </div>
        <div className='item'>
          <div className='name-wrap'>name 111 222 333 444 555 666</div>
          <div className='value-wrap'>value</div>
        </div>
        <div className='item'>
          <div className='name-wrap'>name 111 222 333 444 555 666</div>
          <div className='value-wrap'>
            <div className='fit'>
              <input defaultValue='some'/>
            </div>
          </div>
        </div>
        <div className='item'>
          <div className='name-wrap'>id</div>
          <div className='value-wrap'>
            <div className='fit'>
              <input defaultValue='some 111 222 333 444 555 666 777'/>
            </div>
          </div>
        </div>
      </div>
    );
  });