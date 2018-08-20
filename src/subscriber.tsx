import * as React from 'react';
import { Publisher } from 'objio/common/publisher';

export interface Props<M extends Publisher = Publisher> {
  model: M;
}

export abstract class Subscriber<P extends Props, S = {}> extends React.Component<P, S> {
  protected subscriber = () => {
    this.setState({});
  }

  componentDidMount() {
    this.props.model.subscribe(this.subscriber);
  }

  componentWillUnmount() {
    this.props.model.unsubscribe(this.subscriber);
  }
}
