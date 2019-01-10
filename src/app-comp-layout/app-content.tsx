import * as React from 'react';

interface Props {
  id?: string;
}

export class AppContent extends React.Component<Props> {
  render() {
    return this.props.children;
  }
}
