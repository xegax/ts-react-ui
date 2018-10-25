import * as React from 'react';
import { List2Model, Handler, List2Item } from './model/list2';
import { className as cn } from './common/common';
import { KeyCode } from './common/keycode';
import './_list2.scss';

export { List2Model, List2Item };
const classes = {
  list2ctrl: 'list2-ctrl',
  list2item: 'list2-item',
  list2select: 'list2-select',
  list2focus: 'list2-focus'
};

interface Props<T> {
  className?: string;
  model?: List2Model;
  render?(item: T, idx: number): JSX.Element | string;
  loadNext?(from: number, count: number): Promise<Array<T>>;
  width?: number;
  height?: number;
}

interface State {
  model: List2Model;
}

class ListContent<T extends Object = Object> extends React.Component<Props<T>> {
  private ref = React.createRef<HTMLDivElement>();

  subscriber = () => {
    this.setState({});
  }

  componentDidMount() {
    this.props.model.subscribe(this.subscriber);
  }

  componentWillUnmount() {
    this.props.model.unsubscribe(this.subscriber);
  }

  onScroll = (event: React.UIEvent) => {
    const el = event.currentTarget;
    if (el.scrollHeight - el.clientHeight - el.scrollTop <= 1)
      this.props.model.loadNext();
  }

  onKeyDown = (event: React.KeyboardEvent) => {
    let vec = 0;
    if (event.keyCode == KeyCode.ARROW_DOWN)
      vec = 1;
    else if (event.keyCode == KeyCode.ARROW_UP)
      vec = -1;
    
    if (!vec)
      return;

    event.preventDefault();
    if (this.props.model.setFocus( this.props.model.getFocus() + vec ))
      this.scrollToFocus();
  }

  scrollToFocus() {
    const height = this.props.height;
    const ctrl = this.ref.current;
    const el = ctrl.childNodes.item(this.props.model.getFocus()) as HTMLElement;
    if (!el)
      return;

    if(el.offsetTop + el.offsetHeight >= ctrl.scrollTop + height) {
      ctrl.scrollTop = el.offsetTop + el.offsetHeight - height + 2;
      this.props.model.notify();
    } else if (el.offsetTop < ctrl.scrollTop) {
      ctrl.scrollTop = el.offsetTop;
      this.props.model.notify();
    }
  }

  render() {
    const model = this.props.model;
    const style: React.CSSProperties = {
      width: this.props.width,
      height: this.props.height
    };

    return (
      <div
        ref={this.ref}
        style={style}
        className={cn(classes.list2ctrl, this.props.className)}
        onScroll={this.onScroll}
        onKeyDown={this.onKeyDown}
        tabIndex={model.getFocusable() ? 0 : null}
      >
        {model.getItems().map((item, idx) => {
          return (
            <div
              key={idx}
              className={cn( classes.list2item,
                             model.isSelected(item.id) && classes.list2select,
                             model.getFocus() == idx && classes.list2focus
                           )}
              onClick={event => {
                model.setSelect({id: item.id, clear: !event.ctrlKey});
                if (model.setFocus(idx))
                  this.scrollToFocus();
              }}
            >
              {model.render(item, idx)}
            </div>
          );
        })}
      </div>
    );
  }
}

export class List2<T extends List2Item = List2Item> extends React.Component<Props<T>, State> {
  constructor(props: Props<T>) {
    super(props);

    const model = props.model || new List2Model<T>();
    const handler = { ...model.getHandler() } as Handler<T>;

    if (props.loadNext)
      handler.loadNext = props.loadNext;

    if (props.render)
      handler.render = props.render;

    model.setHandler(handler);
    this.state = { model };
  }

  subscriber = () => {
    this.setState({});
  }

  componentDidMount() {
    this.state.model.subscribe(this.subscriber);
    this.state.model.loadNext();
  }

  componentWillUnmount() {
    this.state.model.unsubscribe(this.subscriber);
  }

  render() {
    return (
      <ListContent
        key={this.state.model.getDataId()}
        {...this.props}
        model={this.state.model}
      />
    );
  }
}
