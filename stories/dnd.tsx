import * as React from 'react';

import { storiesOf } from '@storybook/react';
import { Draggable, Droppable, DropArgs } from '../src/drag-and-drop';
import { Tree, TreeModel } from '../src/tree';
import { FitToParent } from '../src/fittoparent';
import { Publisher } from 'objio/common/publisher';
import { Point } from '../src/common/point';

interface ImgItem {
  label: string;
  url: string;
}

const images: Array<ImgItem> = [
  {label: 'hourglass',  url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Circle-icons-hourglass.svg/512px-Circle-icons-hourglass.svg.png'},
  {label: 'ocean',      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Atlantic_Ocean.png/210px-Atlantic_Ocean.png'},
  {label: 'atlantic',   url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Atlantic_-_panoramio_%281%29.jpg/120px-Atlantic_-_panoramio_%281%29.jpg'},
  {label: 'island',     url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Coney_Island_II_%2879594617%29.jpg/120px-Coney_Island_II_%2879594617%29.jpg'}
];

interface Item {
  pos: Point;
  label: string;
  url: string;
  width: number;
  height: number;
}

class CanvasModel extends Publisher {
  items = Array<Item>();

  add(item: ImgItem, pos: Point) {
    this.items.push({
      pos,
      label: item.label,
      url: item.url,
      width: 100,
      height: 50
    });
    this.delayedNotify();
  }
}

interface Props {
  model: CanvasModel;
  color: string;
  types?: Array<string>;
}

class Canvas extends React.Component<Props, {}> {
  private subsciber = () => {
    this.setState({});
  }

  componentDidMount() {
    this.props.model.subscribe(this.subsciber);
  }

  componentWillUnmount() {
    this.props.model.unsubscribe(this.subsciber);
  }

  onDrop = (drag: DropArgs<ImgItem>) => {
    this.props.model.add(drag.dragData, drag.relPos);
  }

  render() {
    return (
      <Droppable onDropOver={this.onDrop} types={this.props.types}>
        <div style={{flexGrow: 1, position: 'relative'}}>
          {this.props.model.items.map((item, i) => {
            return (
              <Droppable>
              <img
                key={i}
                src={item.url}
                style={{
                  position: 'absolute',
                  left: item.pos.x,
                  top: item.pos.y,
                  width: item.width,
                  height: item.height,
                  border: '1px solid gray'
                }}
              />
              </Droppable>
            );
          })}
        </div>
      </Droppable>
    );
  }
}

storiesOf('Drag and drop', module)
  .add('drag from tree', () => {
    let canvas = new CanvasModel();
    let canvas2 = new CanvasModel();
    let tree = new TreeModel();
    tree.setItems([
      {
        label: 'images',
        open: true,
        children: images.map(img => {
          return {
            label: img.label,
            faIcon: 'file-image-o',
            itemWrap: jsx => <Draggable data={img}>{jsx}</Draggable>
          };
        })
      }, {
        label: 'archive',
        open: true,
        children: images.map(img => {
          return {
            label: img.label,
            faIcon: 'file-zip-o',
            itemWrap: jsx => <Draggable type='zip' data={img}>{jsx}</Draggable>
          };
        })
      }
    ]);

    return (
      <div style={{position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, display: 'flex'}}>
        <div style={{width: 200, flexGrow: 0, display: 'flex', backgroundColor: 'white'}}>
          <FitToParent wrapToFlex>
            <Tree model={tree}/>
          </FitToParent>
        </div>
        <Canvas model={canvas} color='#f0f0f0'/>
        <Canvas model={canvas2} color='#f0ffff' types={['zip']}/>
      </div>
    );
  });