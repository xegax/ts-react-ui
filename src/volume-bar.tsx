import * as React from 'react';
import { startDragging, isDragging } from './common/start-dragging';
import { clamp, className } from './common/common';

const classes = {
  volumeBar: 'volume-bar',
  bar: 'bar',
  valueBar: 'value-bar',
  valueText: 'value-text'
};

interface Props {
  value: number;  // 0 - 1
  height?: number;
  onChanging?(value: number): void;
  onChanged?(value: number): void;
  volumeOnIcon?: string;
  volumeOffIcon?: string;
}

interface State {
  show?: boolean;
}

export class VolumeBar extends React.Component<Props, State> {
  static defaultProps: Partial<Props> = {
    height: 50,
    volumeOnIcon: 'fa fa-volume-up',
    volumeOffIcon: 'fa fa-volume-off'
  };
  state: State = { show: false };

  private icon = React.createRef<HTMLElement>();
  private hiddenIcon = React.createRef<HTMLElement>();
  private bar = React.createRef<HTMLDivElement>();
  private hover = false;

  onMouseEnter = () => {
    this.hover = true;
    if (!isDragging())
      this.setState({ show: true });
  };

  onMouseLeave = () => {
    this.hover = false;
    if (!isDragging())
      this.setState({ show: false });
  };

  onChanging(value: number) {
    this.props.onChanging && this.props.onChanging(value);
  }

  onChanged(value: number) {
    this.props.onChanged && this.props.onChanged(value);
  }

  onVolumeDown = (e: React.MouseEvent) => {
    const pos = this.props.height - (e.pageY - this.bar.current.getBoundingClientRect().top);
    startDragging({x: 0, y: 0}, {
      onDragging: e => {
        this.onChanging( clamp(pos - e.y, [0, this.props.height]) / this.props.height );
      },
      onDragEnd: e => {
        this.onChanged( clamp(pos - e.y, [0, this.props.height]) / this.props.height );
        this.setState({ show: this.hover });
      }
    })(e.nativeEvent);
  };

  render() {
    let w = this.icon.current ? this.icon.current.offsetWidth : 0;
    let h = this.icon.current ? this.icon.current.offsetHeight : 0;
    let volume = clamp(this.props.value, [0, 1]);
    return (
      <div className={classes.volumeBar} onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave}>
        <div
          ref={this.bar}
          className={classes.bar}
          style={{
            display: !this.state.show ? 'none' : null,
            bottom: h + 5,
            width: w,
            height: this.props.height
          }}
          onMouseDown={this.onVolumeDown}
        >
          <div className={classes.valueBar} style={{width: w, height: (volume * 100) + '%'}}/>
          <div className={classes.valueText} style={{bottom: this.props.height}}>
            {Math.ceil(this.props.value * 100) + '%'}
          </div>
        </div>
        <i
          ref={this.hiddenIcon}
          className={this.props.volumeOnIcon}
          style={{position: 'absolute', visibility: 'hidden'}}
        />
        <i
          ref={this.icon}
          style={{ width: this.hiddenIcon.current ? this.hiddenIcon.current.offsetWidth : null }}
          className={this.props.value ? this.props.volumeOnIcon : this.props.volumeOffIcon}
          onClick={() => {
            if (this.props.value)
              this.onChanged(0);
            else
              this.onChanged(1);
          }}
        />
      </div>
    );
  }
}
