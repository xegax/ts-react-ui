import { isLeftDown } from './event-helpers';
import { Point } from './point';

export interface Params {
  x: number;
  y: number;
  minDist?: number;
}

export interface HandlerArgs {
  x: number;
  y: number;
  event: MouseEvent | TouchEvent;
}

export interface DragHandler {
  onDragStart?(event: HandlerArgs);
  onDragging?(event: HandlerArgs);
  onDragEnd?(event: HandlerArgs);
}

function getPagePoint(event: MouseEvent | TouchEvent): Point {
  const mouseEvent = event as MouseEvent;
  const touchEvent = event as TouchEvent;
  if (touchEvent.touches) {
    const evt = touchEvent.touches[0];
    return {x: evt.pageX, y: evt.pageY};
  }
  return {x: mouseEvent.pageX, y: mouseEvent.pageY};
}

let touchDevice = false;
try {
  touchDevice = navigator.appVersion.toLocaleLowerCase().indexOf('mobile') != -1;
} catch(e) {
}

let touchElement: HTMLElement = null;
export function startDragging(args: Params, handler: DragHandler) {
  let touch = false;
  let onDragHandler = (event: MouseEvent | TouchEvent) => {
    let {x, y, minDist} = args;
    if (minDist === undefined)
      minDist = 0;

    let dragValues = { x, y };
    let started = false;
    let clickPoint = getPagePoint(event);

    let onMouseMove = (event: MouseEvent | TouchEvent) => {
      const pagePoint = getPagePoint(event);
      let xOffs = pagePoint.x - clickPoint.x;
      let yOffs = pagePoint.y - clickPoint.y;
      
      if (!started && (minDist == 0 || Math.sqrt(xOffs * xOffs + yOffs * yOffs) > minDist)) {
        started = true;
        handler.onDragStart && handler.onDragStart({x: dragValues.x, y: dragValues.y, event});
      }

      dragValues.x = xOffs + x;
      dragValues.y = yOffs + y;

      if (started) {
        event.preventDefault();
        handler.onDragging && handler.onDragging({x: dragValues.x, y: dragValues.y, event});
      }
    };

    let onMouseUp = (event: MouseEvent) => {
      if (touch) {
        touchElement.removeEventListener('touchmove', onMouseMove);
        touchElement.removeEventListener('touchend', onMouseUp);
      } else {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);

        window.top.removeEventListener('mousemove', onMouseMove);
        window.top.removeEventListener('mouseup', onMouseUp);
      }
      touchElement = null;
      
      if (!started)
        return;

      handler.onDragEnd && handler.onDragEnd({x: dragValues.x, y: dragValues.y, event});
      if (!touch)
        event.preventDefault();
    };

    if (minDist == 0)
      onMouseMove(event);

    if (touch) {
      touchElement.addEventListener('touchmove', onMouseMove);
      touchElement.addEventListener('touchend', onMouseUp);
    } else {
      window.top && window.top.addEventListener('mousemove', onMouseMove);
      window.top && window.top.addEventListener('mouseup', onMouseUp);

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
    
    // event.preventDefault();
    // event.stopPropagation();
  };

  return (e: MouseEvent | TouchEvent) => {
    const isTouch = (e as TouchEvent).touches && (e as TouchEvent).touches.length > 0;
    if (touchDevice && e.type == 'mousedown')
      return false;

    if (touchDevice && (touchElement || !isTouch))
      return false;

    if (e.type == 'mousedown' && !isLeftDown(e as MouseEvent))
      return false;

    touchElement = e.target as HTMLElement;
    touch = isTouch;
    
    onDragHandler(e);
    return true;
  };
}
