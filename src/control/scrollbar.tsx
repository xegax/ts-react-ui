import * as React from 'react';
import { startDragging } from '../common/start-dragging';
import { className as cn } from '../common/common';
import { Timer } from '../common/timer';
import './_scrollbar.scss';

interface Props {
  height: number;

  itemsCount: number;
  itemHeight: number;
  firstItem: number;

  setSelectFirst(item: number): void;

  className?: string;
  extClassName?: string;

  renderElement?(props: React.HTMLProps<any>, btn: 'b-up' | 'thumb' | 'b-down'): JSX.Element;
  width?: number;
  buttons?: boolean;
  minThumbSize?: number;
}

export class Scrollbar extends React.Component<Props, {offset?: number}> {
  private timerUp = new Timer(() => {
    this.timerUp.run(100);
    this.props.setSelectFirst(this.props.firstItem - 1);
  });

  private timerDown = new Timer(() => {
    this.timerDown.run(100);
    this.props.setSelectFirst(this.props.firstItem + 1);
  });

  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  renderElement(props: React.HTMLProps<any>, type: 'b-up' | 'thumb' | 'b-down'): JSX.Element {
    return (
      <div {...props}/>
    );
  }

  render() {
    const props = this.props;

    const className = props.className || 'list-sbar';
    const extClassName = props.extClassName;
    const width = props.width || 16;
    const buttons = props.buttons != null ? props.buttons : true;
    let sbSize = props.minThumbSize || 20;
    let size = props.height;
    const hiddenRows = props.itemsCount - Math.floor(size / props.itemHeight);

    const style: React.CSSProperties = {
      display: hiddenRows <= 0 ? 'none' : null,
      width,
      flexGrow: 0,
      position: 'relative'
    };

    let buttonSize = width;
    let buttonUp: JSX.Element = null;
    let buttonDown: JSX.Element = null;
    if (buttons) {
      size -= buttonSize * 2;
      buttonUp = (
        (this.props.renderElement || this.renderElement)({
          className: 'b-up',
          style: {height: buttonSize, width, position: 'absolute', top: 0},
          onMouseDown: event => {
            startDragging({x: 0, y: 0}, {
              onDragStart: () => {
                props.setSelectFirst(props.firstItem - 1);
                this.timerUp.run(500);
              },
              onDragEnd: () => {
                this.timerUp.stop();
              }
            })(event.nativeEvent);
          }
        }, 'b-up')
      );

      buttonDown = (
        (this.props.renderElement || this.renderElement)({
          className: 'b-down',
          style: {height: buttonSize, width, position: 'absolute', bottom: 0},
          onMouseDown: event => {
            startDragging({x: 0, y: 0}, {
              onDragStart: () => {
                props.setSelectFirst(props.firstItem + 1);
                this.timerDown.run(500);
              },
              onDragEnd: () => {
                this.timerDown.stop();
              }
            })(event.nativeEvent);
          }
        }, 'b-down')
      );
    }

    const pps = Math.max(Math.min(Math.floor((size - sbSize) / hiddenRows), 10), 1);
    sbSize = pps > 1 ? size - pps * hiddenRows : sbSize;
    const bottomPos = size - sbSize;
    const scroll = pps > 1 ? pps * props.firstItem : (props.firstItem / hiddenRows) * bottomPos;
    let top = this.state.offset || scroll;
    if (buttonUp)
      top += buttonSize;

    return (
      <div className={cn(className, extClassName)} style={style}>
        {buttonUp}
        {(this.props.renderElement || this.renderElement)({
          className: 'thumb',
          style: {top, width, height: sbSize, position: 'absolute'},
          onMouseDown: event => startDragging({x: 0, y: scroll, minDist: 2}, {
            onDragging: evt => {
              const pos = Math.min(Math.max(0, evt.y), bottomPos);
              const n = pps > 1 ? Math.floor(pos / pps) : Math.floor((pos / bottomPos) * hiddenRows);
              props.setSelectFirst(n);
              if (pps > 1) {
                this.setState({offset: n  * pps});
              } else {
                this.setState({offset: (n / hiddenRows) * bottomPos});
              }
            },
            onDragEnd: () => {
              this.setState({offset: null});
            }
          })(event.nativeEvent)
        }, 'thumb')}
        {buttonDown}
      </div>
    );
  }
}
