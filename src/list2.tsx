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
  model?: List2Model<T>;
  render?(item: List2Item<T>, idx: number): JSX.Element | string;
  loadNext?(from: number, count: number): Promise<Array< List2Item<T> >>;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
  onBlur?(event: React.FocusEvent<any>);
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
    else if (event.keyCode == KeyCode.ENTER) {
      const item = this.props.model.getFocusItem();
      this.props.model.setSelect({ id: item.id, clear: true });
    }
    
    if (!vec)
      return;

    event.preventDefault();
    if (this.props.model.setFocus( this.props.model.getFocus() + vec ))
      this.scrollToFocus();
  }

  scrollToFocus() {
    const ctrl = this.ref.current;
    const el = ctrl.childNodes.item(this.props.model.getFocus()) as HTMLElement;
    const first = ctrl.firstChild as HTMLElement;
    if (!el)
      return;

    const firstPos = first.getBoundingClientRect();
    const elPos = el.getBoundingClientRect();
    const bbox = ctrl.getBoundingClientRect();

    const offsetTop = elPos.top - bbox.top;
    if (offsetTop < 0) {
      ctrl.scrollTop = Math.round(elPos.top - firstPos.top);
    } else if (offsetTop + el.offsetHeight >= bbox.height) {
      ctrl.scrollTop = Math.round(elPos.top - firstPos.top) + el.offsetHeight - bbox.height + 2;
    }

    this.props.model.notify();
  }

  render() {
    const model = this.props.model;
    const style: React.CSSProperties = {
      width: this.props.width,
      height: this.props.height,
      ...this.props.style
    };

    return (
      <div
        ref={this.ref}
        style={style}
        className={cn(classes.list2ctrl, this.props.className)}
        onScroll={this.onScroll}
        onKeyDown={this.onKeyDown}
        tabIndex={model.getFocusable() ? 0 : null}
        onBlur={this.props.onBlur}
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

export class List2<T> extends React.Component<Props<T>, State> {
  private ref = React.createRef<ListContent>();

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

  onKeyDown(event: React.KeyboardEvent<any>) {
    if (!this.ref || !this.ref.current)
      return;

    this.ref.current.onKeyDown(event);
  }

  render() {
    return (
      <ListContent
        ref={this.ref}
        key={this.state.model.getDataId()}
        {...this.props}
        model={this.state.model}
      />
    );
  }
}
