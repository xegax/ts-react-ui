import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { startDragging } from './common/start-dragging';
import { ContainerModel, ContItem } from './container';
import { Publisher } from 'objio/common/publisher';
import { className as cn } from './common/common';
import { Point } from './common/point';
import { findParent } from './common/dom';

import './_drag-and-drop.scss';

export interface DragProps extends React.HTMLProps<any> {
  data?: any;
  type?: string;
  onDragStart?: () => void;
  enabled?: boolean;
}

export class Draggable extends React.Component<DragProps, {}> {
  onMouseDown = (event: MouseEvent) => {
    if (this.props.enabled == false)
      return;

    let drag: ContItem;
    let children = this.props.children;
    let type = this.props.type;
    let dragData = { ...this.props.data };
    const { onDragStart } = this.props;

    startDragging({ x: 0, y: 0, minDist: 5 }, {
      onDragStart: () => {
        onDragStart && onDragStart();
        setTimeout(() => {
          dropModel.collectDropsForType(type);
          drag = ContainerModel.get().append(
            <div
              style={{
                position: 'absolute',
                left: event.pageX,
                top: event.pageY,
                opacity: 0.5,
                pointerEvents: 'none'
              }}
            >
              {children}
            </div>
          );
        }, 10);
      },
      onDragging: evt => {
        if (!drag)
          return;

        const mouse = evt.event as MouseEvent;
        const el = drag.getElement();
        if (!el)
          return;

        el.style.left = mouse.pageX + 'px';
        el.style.top = mouse.pageY + 'px';
        dropModel.checkDragEvent(mouse, { ...dragData });
      },
      onDragEnd: evt => {
        if (!drag)
          return;

        dropModel.drop(this, evt.event as MouseEvent);
        drag.remove();
      }
    })(event);
  }

  componentWillUnmount() {
    const parent = ReactDOM.findDOMNode(this) as HTMLElement;
    parent.removeEventListener('mousedown', this.onMouseDown);
  }

  componentDidMount() {
    const parent = ReactDOM.findDOMNode(this) as HTMLElement;
    parent.addEventListener('mousedown', this.onMouseDown);
  }

  render() {
    return (
      <React.Fragment>
        {this.props.children}
      </React.Fragment>
    );
  }
}

class DropModel extends Publisher {
  private allDrops = Array<Droppable>();
  private dropList = Array<Droppable>();
  private showDrop: boolean = false;
  private currDrop: Droppable;
  private dragType: string;

  append(drop: Droppable, subscriber: () => void) {
    if (this.allDrops.indexOf(drop) != -1)
      return;

    this.allDrops.push(drop);
    this.subscribe(subscriber);
  }

  remove(drop: Droppable, subscriber: () => void) {
    this.unsubscribe(subscriber);
    this.allDrops.splice(this.allDrops.indexOf(drop), 1);
    this.dropList.splice(this.dropList.indexOf(drop), 1);
  }

  getShowDrop(types: Array<string>): boolean {
    if (!this.showDrop)
      return false;

    return !types || types.indexOf(this.dragType) != -1;
  }

  collectDropsForType(dragType?: string): void {
    this.showDrop = true;
    this.dragType = dragType;
    this.dropList = this.allDrops.filter(drop => {
      return !drop.props.types || drop.props.types.indexOf(this.dragType) != -1;
    });
    this.delayedNotify();
  }

  getCurrDrop(): Droppable {
    return this.currDrop;
  }

  getRelPoint(event: MouseEvent, drop: Droppable): Point {
    const el = ReactDOM.findDOMNode(drop) as HTMLElement;
    const bbox = el.getBoundingClientRect();
    return { x: event.pageX - bbox.left, y: event.pageY - bbox.top };
  }

  checkDragEvent(event: MouseEvent, data: any): void {
    const drop = this.dropList.slice().reverse().find(drop => {
      return findParent(event.srcElement as HTMLElement, drop.getElement())
    });

    if (this.currDrop != drop) {
      this.currDrop && this.onDragLeave(this.currDrop);
      this.currDrop = drop;
      this.currDrop && this.onDragEnter(this.currDrop, event, data);

      this.delayedNotify();
    } else if (this.currDrop) {
      this.currDrop && this.onDragOver(this.currDrop, event, data);
    }
  }

  onDragEnter(dp: Droppable, event: MouseEvent, dragData: any): void {
    const args = {
      event,
      dragData,
      dropData: dp.props.dropData,
      relPos: this.getRelPoint(event, this.currDrop)
    };
    try {
      dp.props.onDragEnter && dp.props.onDragEnter(args);
    } catch (e) {
    }
  }

  onDragOver(dp: Droppable, event: MouseEvent, dragData: any): void {
    const args = {
      event,
      dragData,
      dropData: dp.props.dropData,
      relPos: this.getRelPoint(event, this.currDrop)
    };
    try {
      dp.props.onDragOver && dp.props.onDragOver(args);
    } catch (e) {
    }
  }

  onDragLeave(dp: Droppable): void {
    try {
      dp.props.onDragLeave && dp.props.onDragLeave();
    } catch (e) {
    }
  }

  drop(drag: Draggable, event: MouseEvent): void {
    if (this.currDrop && this.currDrop.props.onDrop)
      this.currDrop.props.onDrop({
        event,
        dragData: drag.props.data,
        dropData: this.currDrop.props.dropData,
        relPos: this.getRelPoint(event, this.currDrop)
      });

    this.showDrop = false;
    this.currDrop = null;
    this.dropList = [];
    this.delayedNotify();
  }
}

const dropModel = new DropModel();

const dropClasses = {
  dndHighlight: 'dnd-highlight',
  dndOver: 'dnd-over'
};

export interface DropArgs<TDrag = Object, TDrop = Object> {
  event: MouseEvent;
  relPos: Point;
  dragData: TDrag;
  dropData: TDrop;
}

export interface DropProps {
  types?: Array<string>;
  dropData?: any;

  onDragEnter?(args: DropArgs): void;
  onDragLeave?(): void;
  onDragOver?(args: DropArgs): void;
  onDrop?(args: DropArgs): void;
  children: React.ReactChild;
}

export class Droppable extends React.Component<DropProps, {}> {
  private mount: boolean = false;

  private subscriber = () => {
    if (this.mount)
      this.setState({});
  }

  componentDidMount() {
    this.mount = true;
    dropModel.append(this, this.subscriber);
  }

  componentWillUnmount() {
    this.mount = false;
    dropModel.remove(this, this.subscriber);
  }

  getElement(): HTMLElement {
    try {
      return ReactDOM.findDOMNode(this) as HTMLElement;
    } catch (e) {
      return null;
    }
  }

  render() {
    const child = React.Children.only(this.props.children);
    const showDrop = dropModel.getShowDrop(this.props.types) && dropClasses.dndHighlight;
    return (
      React.cloneElement(child, {
        ...this.props,
        className: cn(
          child.props.className,
          showDrop,
          dropModel.getCurrDrop() == this && dropClasses.dndOver
        )
      })
    );
  }
}
