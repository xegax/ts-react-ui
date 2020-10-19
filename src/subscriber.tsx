import * as React from 'react';
import { Publisher } from 'objio/common/publisher';

export { Publisher };

export interface PropsOld<M extends Publisher = Publisher> {
  model?: M;
}

export abstract class SubscriberOld<P extends PropsOld, S = {}> extends React.Component<P, S> {
  private mount: boolean = false;

  protected subscriber = () => {
    if (this.mount)
      this.setState({});
  }

  componentDidMount() {
    this.mount = true;
    this.props.model.subscribe(this.subscriber);
  }

  componentWillUnmount() {
    this.mount = false;
    this.props.model.unsubscribe(this.subscriber);
  }
}

interface Props {
  model: Publisher;
  render(): JSX.Element;
}

interface State {
  model?: Publisher;
  subscriber?(): void;
}

export class Subscriber extends React.Component<Props, State> {
  state: State = {
    subscriber: () => {
      this.setState({});
    }
  };

  static getDerivedStateFromProps(next: Props, state: State): State | null {
    if (next.model != state.model) {
      state.model?.unsubscribe(state.subscriber);
      next.model?.subscribe(state.subscriber);

      return { model: next.model };
    }
    return null;
  }

  render() {
    return this.props.render();
  }
}
