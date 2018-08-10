import * as React from 'react';
import { LayoutModel, LayoutCont, LayoutItem } from './model/layout';
import { className as cn } from './common/common';
import { Droppable, DropArgs } from './drag-and-drop';
import './_layout.scss';
import { ContainerModel, ContItem } from './container';
import { Rect } from './common/rect';
import { Point } from './common/point';
import { startDragging } from './common/start-dragging';

interface DropZone {
  show: Rect;
  id: 'top' | 'bottom' | 'left' | 'right' | 'after' | 'before';
  item: LayoutItem | LayoutCont;
}

const classes = {
  layout: 'layout-ctrl',
  row: 'layout-ctrl-row',
  col: 'layout-ctrl-col',
  item: 'layout-ctrl-item',
  rowsSplit: 'layout-ctrl-rows-spliter',
  colsSplit: 'layout-ctrl-cols-spliter'
};

interface Props {
  model: LayoutModel;
  width?: number;
  height?: number;
}

class DroppableLayout {
  private dropZone: DropZone;
  private overlay: ContItem;
  private layout: Layout;

  constructor(layout: Layout) {
    this.layout = layout;
  }

  getRootElement(): HTMLDivElement {
    return this.layout.props.model.getLayout().ref.current;
  }

  getModel(): LayoutModel {
    return this.layout.props.model;
  }

  private getRootDropZone(cursor: Point): DropZone {
    const bbox = this.getRootElement().getBoundingClientRect();
    if (cursor.x - bbox.left <= 5) {
      return {
        id: 'left',
        item: null,
        show: {x: bbox.left, y: bbox.top, width: bbox.width / 2, height: bbox.height}
      };
    } else if (bbox.right - cursor.x <= 5) {
      return {
        id: 'right',
        item: null,
        show: {x: bbox.left + bbox.width / 2, y: bbox.top, width: bbox.width / 2, height: bbox.height}
      };
    } else if (cursor.y - bbox.top <= 5) {
      return {
        id: 'top',
        item: null,
        show: {x: bbox.left, y: bbox.top, width: bbox.width, height: bbox.height / 2}
      };
    } else if (bbox.bottom - cursor.y <= 5) {
      return {
        id: 'bottom',
        item: null,
        show: {x: bbox.left, y: bbox.top + bbox.height / 2, width: bbox.width, height: bbox.height / 2}
      };
    }

    return null;
  }

  private findDropZone(item: LayoutItem | LayoutCont, cursor: Point): DropZone {
    const zone = this.getRootDropZone(cursor);
    if (zone)
      return zone;

    const model = this.getModel();
    let cont = model.findParent(item);
    if (!cont)
      return null;

    const bbox = item.ref.current.getBoundingClientRect();
    const rect = {x: bbox.left, y: bbox.top, width: bbox.width, height: bbox.height};
    const itemIdx = cont.items.indexOf(item);

    const minDist = 20;
    if (cont.type == 'row') {
      if (cursor.x - rect.x <= minDist) {
        const show = {...rect, width: rect.width / 2};
        if (itemIdx != 0)
          show.x -= show.width / 2;
        return { id: 'before', show, item };
      } else if (rect.x + rect.width - cursor.x <= minDist) {
        const show = {...rect, x: rect.x + rect.width / 2, width: rect.width / 2};
        if (itemIdx != cont.items.length - 1)
          show.x += show.width / 2;
        return { id: 'after', show, item }
      } else if (cursor.y - rect.y <= minDist || rect.y + rect.height - cursor.y <= minDist) {
        const zone = this.findDropZone(cont, cursor);
        if (zone && zone.id == 'before' || zone.id == 'after')
          return zone;
      }

      const size = rect.height / 2;
      if (cursor.y <= rect.y + size)
        return {id: 'top', show: {...rect, height: size}, item};
      else
        return {id: 'bottom', show: {...rect, height: size, y: rect.y + size}, item};
    } else if (cont.type == 'col') {

      if (cursor.y - rect.y <= minDist) {
        const show = {...rect, height: rect.height / 2};
        if (itemIdx != 0)
          show.y -= show.height / 2;
        return { id: 'before', show, item };
      } else if (rect.y + rect.height - cursor.y <= minDist) {
        const show = {...rect, y: rect.y + rect.height / 2, height: rect.height / 2};
        if (itemIdx != cont.items.length - 1)
          show.y += show.height / 2;
        return { id: 'after', show, item }
      } else if (cursor.x - rect.x <= minDist || rect.x + rect.width - cursor.x <= minDist) {
        const zone = this.findDropZone(cont, cursor);
        if (zone && zone.id == 'before' || zone.id == 'after')
          return zone;
      }

      const size = rect.width / 2;
      if (cursor.x <= rect.x + size)
        return {id: 'left', show: {...rect, width: size}, item};
      else
        return {id: 'right', show: {...rect, width: size, x: rect.x + size}, item};
    }
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
    } else {
      this.dropZone = this.findDropZone(args.dropData, {x: args.event.pageX, y: args.event.pageY});
      if (this.dropZone)
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

    const dragData = {...args.dragData};
    const model = this.getModel();

    if (!args.dropData && model.getLayout().items.length == 0) {
      model.getLayout().items.push(dragData);
      model.setLastDrop(dragData);
      return model.delayedNotify({type: 'change'});
    } else if (this.dropZone) {
      const parent = model.findParent(this.dropZone.item);
      const idx = parent ? parent.items.indexOf(this.dropZone.item) : -1;
      let cont: LayoutCont;
      const id = this.dropZone.id;
      if (id == 'before') {
        parent.items.splice(idx, 0, dragData);
      } else if (id == 'after') {
        parent.items.splice(idx + 1, 0, dragData);
      } else {
        const item = this.dropZone.item || model.getLayout();
        if (id == 'top') {
          cont = { items: [dragData, item], type: 'col' };
        } else if (id == 'bottom') {
          cont = { items: [item, dragData], type: 'col' };
        } else if (id == 'left') {
          cont = { items: [dragData, item], type: 'row' };
        } else if (id == 'right') {
          cont = { items: [item, dragData], type: 'row' };
        }
        
        if (this.dropZone.item)
          parent.items.splice(parent.items.indexOf(item), 1, cont);
        else
          model.setLayout(cont);
      }
      model.setLastDrop(dragData);
    }

    model.delayedNotify({type: 'change'});
  };

  droppableItem(item: JSX.Element, data?: LayoutItem | LayoutCont, key?: string): JSX.Element {
    return (
      <Droppable
        key={key}
        dropData={data}
        onDropOver={this.dropOver}
        onDragEnter={this.dragStart}
        onDragLeave={this.dragLeave}
        onDragOver={this.dragMove}
      >
        {item}
      </Droppable>
    );
  }
}

export class Layout extends React.Component<Props, {phase?: 'move-splitter'}> {
  private droppable = new DroppableLayout(this);

  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  private subscriber = () => {
    this.setState({});
  };

  componentDidMount() {
    this.props.model.subscribe(this.subscriber);
  }

  componentWillUnmount() {
    this.props.model.unsubscribe(this.subscriber);
  }

  dragSplitter(event: React.MouseEvent, cont: LayoutCont, idx: number) {
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
        this.props.model.notify();
      },
      onDragEnd: () => {
        spliter.remove();
        this.setState({phase: null});
        this.props.model.delayedNotify({type: 'change'});
      }
    })(event.nativeEvent);
  }

  renderSpliter(cont: LayoutCont, idx: number): JSX.Element {
    if (cont.items.length - 1 == idx || this.state.phase == 'move-splitter')
      return null;

    return (
      <div
        onMouseDown={evt => this.dragSplitter(evt, cont, idx)}
        className={cn(cont.type == 'row' && classes.rowsSplit || classes.colsSplit)}
      />
    );
  }

  renderCont(cont: LayoutCont, idx?: number, parent?: LayoutCont, key?: string): JSX.Element {
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

  renderItem(item: LayoutItem, idx: number, cont: LayoutCont, key: string): JSX.Element {
    item.ref = item.ref || React.createRef();
    const flexGrow = item.grow;
    return this.droppable.droppableItem(
      <div className={classes.item} ref={item.ref} style={{flexGrow}} key={key}>
        <div style={{position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, display: 'flex'}}>
          {this.props.model.getMap()[item.id]}
        </div>
        {this.renderSpliter(cont, idx)}
      </div>,
      item,
      key
    );
  }

  render() {
    const { width, height } = this.props;
    const model = this.props.model;
    const layout = model.getLayout();
    const el = (
      <div className={classes.layout} style={{width, height}}>
        {this.renderCont(layout)}
      </div>
    );

    if (layout.items.length != 0)
      return el;

    return this.droppable.droppableItem(el);
  }
}
