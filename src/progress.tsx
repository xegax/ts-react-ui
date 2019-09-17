import * as React from 'react';
import { cn } from './common/common';

interface Props {
  value?: number;  // 0 - 1
  size?: number;
  className?: string;
}

interface State {
  time: number;
}

const classes = {
  ctrl: 'progress-ctrl',
  bar: 'bar',
  anim: 'anim'
};

export class Progress extends React.Component<Props, State> {
  static defaultProps: Props = {
    size: 5
  };

  render() {
    let s: React.CSSProperties = {};
    if (this.props.value != null)
      s.width = this.props.value * 100 + '%';

    return (
      <div
        className={cn(classes.ctrl, this.props.className)}
        style={{ height: this.props.size }}
      >
        <div
          className={cn(classes.bar, this.props.value == null && classes.anim)}
          style={s}
        />
      </div>
    );
  }
}
