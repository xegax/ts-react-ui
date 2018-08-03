import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { startDragging } from './common/start-dragging';
import { ContainerModel, ContItem } from './container';
import { Publisher } from './common/publisher';
import { className as cn } from './common/common';
import { Point } from './common/point';
import { findParent } from './common/dom';

import './_drag-and-drop.scss';

export interface DragProps extends React.HTMLProps<any> {
  data?: any;
  type?: string;
}

export class Draggable extends React.Component<DragProps, {}> {
  componentDidMount() {
    const parent = ReactDOM.findDOMNode(this) as HTMLElement;

    parent.addEventListener('mousedown', event => {
      let drag: ContItem;

      startDragging({ x: 0, y: 0, minDist: 5 }, {
        onDragStart: () => {
          dropModel.showDropForType(this.props.type);
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
              {this.props.children}
            </div>
          );
        },
        onDragging: evt => {
          const mouse = evt.event as MouseEvent;
          const el = drag.getElement();
          if (!el)
            return;

          el.style.left = mouse.pageX + 'px';
          el.style.top = mouse.pageY + 'px';
          dropModel.checkDragEvent(mouse, this.props.data);
        },
        onDragEnd: evt => {
          dropModel.drop(this, evt.event as MouseEvent);
          drag.remove();
        }
      })(event);
    });
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
  }

  getShowDrop(types: Array<string>): boolean {
    if (!this.showDrop)
      return false;

    return !types || types.indexOf(this.dragType) != -1;
  }

  showDropForType(dragType?: string): void {
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

  onDragEnter(dp: Droppable, event: MouseEvent, data: any): void {
    const args = { event, data, relPos: this.getRelPoint(event, this.currDrop) };
    try {
      dp.props.onDragEnter && dp.props.onDragEnter(args);
    } catch(e) {
    }
  }

  onDragOver(dp: Droppable, event: MouseEvent, data: any): void {
    const args = { event, data, relPos: this.getRelPoint(event, this.currDrop) };
    try {
      dp.props.onDragOver && dp.props.onDragOver(args);
    } catch(e) {
    }
  }

  onDragLeave(dp: Droppable): void {
    try {
      dp.props.onDragLeave && dp.props.onDragLeave();
    } catch(e) {
    }
  }

  drop(drag: Draggable, event: MouseEvent): void {
    if (this.currDrop && this.currDrop.props.onDropOver)
      this.currDrop.props.onDropOver({
        event,
        data: drag.props.data,
        relPos: this.getRelPoint(event, this.currDrop)
      });

    this.showDrop = false;
    this.currDrop = null;
    this.dropList = [];
    this.delayedNotify();
  }
}

let dropModel = new DropModel();

const dropClasses = {
  dropHighlight: 'drop-highlight',
  dropOver: 'drop-over'
};

export interface DropArgs<T = Object> {
  event: MouseEvent;
  relPos: Point;
  data: T;
}

export interface DropProps {
  types?: Array<string>;

  onDragEnter?(args: DropArgs): void;
  onDragLeave?(): void;
  onDragOver?(args: DropArgs): void;
  onDropOver?(args: DropArgs): void;
  children: React.ReactChild;
}

export class Droppable extends React.Component<DropProps, {}> {
  private el: HTMLElement;

  private subscriber = () => {
    this.setState({});
  }

  componentDidMount() {
    this.el = ReactDOM.findDOMNode(this) as HTMLElement;  
    dropModel.append(this, this.subscriber);
  }

  componentWillUnmount() {
    dropModel.remove(this, this.subscriber);
  }

  getElement(): HTMLElement {
    return this.el;
  }

  render() {
    const child = React.Children.only(this.props.children);
    const showDrop = dropModel.getShowDrop(this.props.types) && dropClasses.dropHighlight;
    return (
      React.cloneElement(child, {
        className: cn(
          child.props.className,
          showDrop,
          dropModel.getCurrDrop() == this && dropClasses.dropOver
        )
      })
    );
  }
}
