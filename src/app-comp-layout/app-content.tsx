import * as React from 'react';

interface Props {
}

export class AppContent extends React.Component<Props> {
  render() {
    return this.props.children;
  }
}
