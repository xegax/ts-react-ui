import * as React from 'react';
import { List2Model, Handler } from './model/list2';

export { List2Model };

interface Props<T> {
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

  render() {
    const model = this.props.model;
    const style: React.CSSProperties = {
      width: this.props.width,
      height: this.props.height,
      overflowY: 'auto'
    };

    return (
      <div style={style} onScroll={this.onScroll}>
        {model.getItems().map((item, idx) => model.render(item, idx))}
      </div>
    );
  }
}

export class List2<T extends Object = Object> extends React.Component<Props<T>, State> {
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
