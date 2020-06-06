import * as React from 'react';
import { LayoutModel, LayoutCont, LayoutItem, DropZone } from './model/layout';
import { className as cn } from './common/common';
import { Droppable, DropArgs, Draggable, DragProps } from './drag-and-drop';
import './_layout.scss';
import { ContainerModel, ContItem } from './container';
import { Rect } from './common/rect';
import { Point } from './common/point';
import { startDragging } from './common/start-dragging';

const classes = {
  layout: 'layout-ctrl',
  row: 'layout-ctrl-row',
  col: 'layout-ctrl-col',
  item: 'layout-ctrl-item',
  rowsSplit: 'layout-ctrl-rows-spliter',
  colsSplit: 'layout-ctrl-cols-spliter'
};

class DroppableLayout {
  private dropZone: DropZone;
  private overlay: ContItem;
  private layout: Layout;

  constructor(layout: Layout) {
    this.layout = layout;
  }

  getModel(): LayoutModel {
    return this.layout.state.model;
  }

  private findDropZone(item: LayoutItem | LayoutCont, cursor: Point): DropZone {
    return this.getModel().findDropZone(item, cursor);
  }

  dragStart = (args: DropArgs<LayoutItem, LayoutItem | LayoutCont>) => {
    this.overlay = ContainerModel.get().append(
      <div style={{
        position: 'absolute',
        left: 0, top: 0,
        width: 0, height: 0,
        backgroundColor: 'blue',
        opacity: 0.2,
        pointerEvents: 'none'
      }}/>
    );
  };

  dragMove = (args: DropArgs<LayoutItem, LayoutItem | LayoutCont>) => {
    const bbox = (args.dropData || { ref: this.getModel().getLayout().ref }).ref.current.getBoundingClientRect();
    const bboxRect = {x: bbox.left, y: bbox.top, width: bbox.width, height: bbox.height};

    let dropRect: Rect;
    if (!args.dragData) {
      dropRect = bboxRect;
    } else if (this.dropZone = this.findDropZone(args.dropData, {x: args.event.pageX, y: args.event.pageY})) {
      dropRect = this.dropZone.show;
    }

    const style = this.overlay.getElement().style;
    if (dropRect) {
      style.visibility = 'visible';
      style.left = dropRect.x + 'px';
      style.top = dropRect.y + 'px';
      style.width = dropRect.width + 'px';
      style.height = dropRect.height + 'px';
    } else {
      style.visibility = 'hidden';
    }
  };

  dragLeave = () => {
    ContainerModel.get().remove(this.overlay);
    this.overlay = null;
  };

  private dropOver = (args: DropArgs<LayoutItem, LayoutItem | LayoutCont>) => {
    ContainerModel.get().remove(this.overlay);
    this.overlay = null;

    const model = this.getModel();
    const handler = model.getHandler();
    let dragData = {...args.dragData};

    const dropImpl = (dragData: LayoutItem) => {
      if (!args.dropData && model.getLayout().items.length == 0) {
        model.getLayout().items.push(dragData);
        model.setLastDrop(dragData);
      } else if (this.dropZone) {
        if (model.putRelativeTo(dragData, this.dropZone.item, this.dropZone.putPlace))
          model.setLastDrop(dragData);
        else
          return;
      }

      model.delayedNotify({type: 'change'});
    }

    if (model.getLastDrag())
      return dropImpl(dragData);

    if (!handler.onDrop)
      return console.error('handler.onDrop must be defined');
      
    const res = handler.onDrop(dragData, model);
    if (!res)
      return console.error('onDrop must return item with unique id');

    (res instanceof Promise ? res : Promise.resolve(res))
    .then(item => {
      if (!item.id || model.findItem(item.id))
        return console.error('onDrop must return item with unique id');

      dropImpl(item);
    });
  };

  droppableItem(item: JSX.Element, data?: LayoutItem | LayoutCont, key?: string): JSX.Element {
    return (
      <Droppable
        types={['layout']}
        key={key}
        dropData={data}
        onDrop={this.dropOver}
        onDragEnter={this.dragStart}
        onDragLeave={this.dragLeave}
        onDragOver={this.dragMove}
      >
        {item}
      </Droppable>
    );
  }
}

interface HeaderProps extends DragProps {
  layout: LayoutModel;
  data: { id: string };
}

export const Header = (props: HeaderProps) => {
  return (
    <Draggable
      {...props}
      type='layout'
      onDragStart={() => props.layout.setDragStart(props.data.id)}
    >
      {props.children}
    </Draggable>
  );
}

export interface Props {
  className?: string;
  model?: LayoutModel;
  width?: number;
  height?: number;
  onDrop?(item: LayoutItem, layout: LayoutModel): LayoutItem;
}

interface State {
  phase?: 'move-splitter',
  model: LayoutModel;
}

// Layout can't change model on the fly
export class Layout extends React.Component<Props, State> {
  private droppable = new DroppableLayout(this);

  constructor(props: Props) {
    super(props);
    const model = props.model || new LayoutModel();
    this.state = { model };

    const handler = { ...model.getHandler() };
    handler.onDrop = props.onDrop || handler.onDrop;
    model.setHandler(handler);
  }

  private subscriber = () => {
    this.setState({});
  };

  componentDidMount() {
    this.state.model.subscribe(this.subscriber);
  }

  componentWillUnmount() {
    this.state.model.unsubscribe(this.subscriber);
  }

  private dragSplitter(event: React.MouseEvent, cont: LayoutCont, idx: number) {
    const bbox = event.currentTarget.getBoundingClientRect();
    const style: React.CSSProperties = {
      left: bbox.left,
      top: bbox.top,
      width: bbox.width,
      height: bbox.height
    };

    let spliter: ContItem;
    const rects = [
      cont.items[idx].ref.current.getBoundingClientRect(),
      cont.items[idx + 1].ref.current.getBoundingClientRect()
    ];
    const sizes = cont.type == 'row' ?
      [ rects[0].width, rects[1].width ] : [ rects[0].height, rects[1].height ];
    const fullSize = cont.type == 'row' ? 
      cont.ref.current.getBoundingClientRect().width : cont.ref.current.getBoundingClientRect().height;

    startDragging({x: 0, y: 0}, {
      onDragStart: () => {
        const className = cn(cont.type == 'row' && classes.rowsSplit || classes.colsSplit );
        spliter = ContainerModel.get().append(<div style={style} className={className}/>);
        this.setState({phase: 'move-splitter'});
      },
      onDragging: event => {
        const el = spliter.getElement();
        if (!el)
          return;

        const offs = cont.type == 'row' ? event.x : event.y;
        const newSizes = [sizes[0] + offs, sizes[1] - offs];
        
        cont.items[idx].grow = newSizes[0] * cont.items.length / fullSize;
        cont.items[idx + 1].grow = newSizes[1] * cont.items.length / fullSize;

        if (cont.type == 'row')
          el.style.left = (bbox.left + event.x) + 'px';
        else
          el.style.top = (bbox.top + event.y) + 'px';
        this.state.model.notify();
      },
      onDragEnd: () => {
        spliter.remove();
        this.setState({phase: null});
        this.state.model.delayedNotify({type: 'change'});
      }
    })(event.nativeEvent);
  }

  private renderSpliter(cont: LayoutCont, idx: number): JSX.Element {
    if (cont.items.length - 1 == idx || this.state.phase == 'move-splitter')
      return null;

    return (
      <div key={'split-' + idx}
        onMouseDown={evt => this.dragSplitter(evt, cont, idx)}
        className={cn(cont.type == 'row' && classes.rowsSplit || classes.colsSplit)}
      />
    );
  }

  private renderCont(cont: LayoutCont, idx?: number, parent?: LayoutCont, key?: string): JSX.Element {
    const flexGrow = cont.grow;
    const arr = cont.items.map((itemOrCont, i) => {
      const item = itemOrCont as LayoutItem
      if (item.id)
        return this.renderItem(item, i, cont, 'item-' + i);
      return this.renderCont(itemOrCont as LayoutCont, i, cont, 'cont-' + i);
    });

    if (parent) {
      const spliter = this.renderSpliter(parent, idx);
      if (spliter)
        arr.push(spliter);
    }

    const className = cn(
      cont.type == 'row' && classes.row,
      cont.type == 'col' && classes.col
    );
    cont.ref = cont.ref || React.createRef();

    return (
      <div className={className} ref={cont.ref} style={{flexGrow}} key={key}>
        {arr}
      </div>
    );
  }

  private renderItem(item: LayoutItem, idx: number, cont: LayoutCont, key: string): JSX.Element {
    item.ref = item.ref || React.createRef();
    const flexGrow = item.grow;
    const element = this.state.model.getMap()[item.id];
    return this.droppable.droppableItem(
      <div className={classes.item} ref={item.ref} style={{flexGrow}} key={key}>
        <div style={{position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, display: 'flex'}}>
          {element ? React.cloneElement(element, { layout: this.state.model }) : null}
        </div>
        {this.renderSpliter(cont, idx)}
      </div>,
      item,
      key
    );
  }

  render() {
    const { width, height } = this.props;
    const model = this.state.model;
    const layout = model.getLayout();
    const el = (
      <div className={cn(classes.layout, this.props.className)} style={{width, height}}>
        {this.renderCont(layout)}
      </div>
    );

    if (layout.items.length != 0)
      return el;

    return this.droppable.droppableItem(el);
  }
}
