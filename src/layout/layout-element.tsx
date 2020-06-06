import * as React from 'react';

export interface Props {
  key: string;
}

export class LayoutElement extends React.Component<Props> {
  render() {
    return this.props.children;
  }
}
