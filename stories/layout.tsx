import * as React from 'react';

import { storiesOf } from '@storybook/react';
import { Layout, Header} from '../src/layout';
import { LayoutModel, LayoutItem } from '../src/model/layout';
import { Draggable, Droppable, DropArgs } from '../src/drag-and-drop';
import { Publisher } from 'objio/common/publisher';

class Container extends Publisher {
  private static idCounter = 0;
  private images = Array<string>();
  private curr: number = 0;
  private id: string;
  private bgColor: string;

  static create(bgColor: string): Container {
    const cont = new Container();
    Container.idCounter++;
    cont.id = 'id-' + Container.idCounter;
    cont.bgColor = bgColor;
    return cont;
  }

  getId(): string {
    return this.id;
  }

  getImg(): string {
    return this.images[this.curr % this.images.length];
  }

  getBgColor() {
    return this.bgColor;
  }

  next(dir: number) {
    const newIdx = Math.max(0, this.curr + dir );
    if (newIdx == this.curr)
      return;

    this.curr = newIdx;
    this.delayedNotify();
  }
  
  addImg(url: string) {
    if (this.images.indexOf(url) != -1)
      return;

    this.curr = this.images.length;
    this.images.push(url);
    this.delayedNotify();
  }

  imageCount() {
    return this.images.length;
  }
}

let contItems: { [id: string]: Container } = {};

interface Props {
  model: Container;
  layout?: LayoutModel;
}

class ContainerView extends React.Component<Props, { drag?: boolean }> {
  state = { drag: false };

  subscriber = () => {
    this.setState({});
  }

  componentDidMount() {
    this.props.model.subscribe(this.subscriber);
  }

  componentWillUnmount() {
    console.log('unsubscribe');
    this.props.model.unsubscribe(this.subscriber);
  }

  onDragEnter = () => {
    this.setState({ drag: true });
  };

  onDragLeave = () => {
    this.setState({ drag: false });
  };

  onDrop = (data: DropArgs<{url: string}>) => {
    this.props.model.addImg(data.dragData.url);
    this.setState({ drag: false });
  };

  render() {
    const model = this.props.model;
    const style: React.CSSProperties = {
      flexGrow: 1,
      border: '1px solid black',
      backgroundColor: model.getBgColor()
    };
    style.position = 'relative';

    const id = model.getId();
    const url = model.getImg();
    if (url) {
      style.backgroundImage = `url("${url}")`;
      style.backgroundSize = 'contain';
      style.backgroundRepeat = 'no-repeat';
      style.backgroundPosition = 'center';
    }

    if (this.state.drag)
      style.backgroundColor = 'silver';

    const displayLeftRight = model.imageCount() > 1 ? null : 'none';
    return (
      <Droppable
        key={id}
        types={['image']}
        onDragEnter={this.onDragEnter}
        onDragLeave={this.onDragLeave}
        onDrop={this.onDrop}
      >
        <div className='test' style={style}>
          <Header
            layout={this.props.layout}
            data={{id}}
          >
            <div style={{height: 30, backgroundColor: 'lightblue'}}>drag me</div>
          </Header>
          {'item ' + id}
          <button onClick={() => {
            this.props.layout.remove(model.getId());
          }}>remove</button>
          <button
            onClick={() => model.next(1)}
            style={{position: 'absolute', right: 0, bottom: 0, display: displayLeftRight}}
          >
            next
          </button>
          <button
            onClick={() => model.next(-1)}
            style={{position: 'absolute', left: 0, bottom: 0, display: displayLeftRight}}
          >
            prev
          </button>
        </div>
      </Droppable>
    );
  }
}

const pal = ['#cfcef5', '#aa93d6', '#865f73', '#fecc0c', '#828c59'];
const viewList = pal.map((color, i) => ({
  item: (
    <Draggable
      key={i}
      type='layout'
      data={{id: i}}
    >
      <div style={{color, cursor: 'default'}}>
        item {i}
      </div>
    </Draggable>
  )
}));

[
  'https://st.depositphotos.com/1000459/3168/i/950/depositphotos_31687753-stock-photo-green-water-drops.jpg',
  'http://bgfons.com/uploads/pattern/pattern_texture1157.jpg',
  'https://f.vividscreen.info/soft/8a2f2b72606bc412dd22e484b6b44649/Orange-Abstract-Pattern-wide-i.jpg',
  'https://img.getbg.net/upload/full/8/333032_tekstura_bumaga_ogon_korichnevyj_zheltyj_bumazhnyj_1920x1200_(www.GetBg.net).jpg'
].forEach((url, i) =>
  viewList.push({
    item: (
      <Draggable key={viewList.length} type='image' data={{ url }}>
        <div>image {i + 1}</div>
      </Draggable>
    )
  })
);

function onDrop(item: LayoutItem, layout: LayoutModel) {
  const cont = Container.create( pal[ item.id ]);
  contItems[ cont.getId() ] = cont;

  let map: {[id: string]: JSX.Element} = {};
  Object.keys(contItems).forEach(id => {
    map[id] = <ContainerView key={id} model={contItems[id]}/>;
  });
  layout.setMap(map);

  return { id: cont.getId() };
}

storiesOf('Layout', module)
  .add('layout', () => {
    return (
      <div style={{position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'row'}}>
        <div style={{width: 200, flexGrow: 0, backgroundColor: 'silver', userSelect: 'none'}}>
          { viewList.map(item => item.item) }
        </div>
        <div style={{display: 'flex', flexGrow: 1}}>
          <Layout onDrop={onDrop}/>
        </div>
      </div>
    );
  });