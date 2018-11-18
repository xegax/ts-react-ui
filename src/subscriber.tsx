import * as React from 'react';
import { Publisher } from 'objio/common/publisher';

export interface Props<M extends Publisher = Publisher> {
  model?: M;
}

export abstract class Subscriber<P extends Props, S = {}> extends React.Component<P, S> {
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
