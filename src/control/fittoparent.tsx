import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Timer } from '../common/timer';

interface State {
  width?: number;
  height?: number;
}

interface Props extends React.HTMLProps<any> {
  wrapToFlex?: boolean;
}

export class FitToParent extends React.Component<Props, State> {
  private parent: HTMLElement;
  static timer = new Timer();

  constructor(props) {
    super(props);

    this.state = {};
  }

  private updateSize = () => {
    if (!this.parent)
      return;

    const {clientWidth, clientHeight} = this.parent;

    const style = window.getComputedStyle(this.parent);
    const padding = ['paddingTop', 'paddingLeft', 'paddingBottom', 'paddingRight'].map(k => parseFloat(style[k]));
    let paddingX = (padding.length == 1 ? padding[0] * 2 : (padding[1] + padding[3])) || 0;
    let paddingY = (padding.length == 1 ? padding[0] * 2 : (padding[0] + padding[2])) || 0;

    const width = clientWidth - paddingX;
    const height = clientHeight - paddingY;
    if (this.state.width == width && this.state.height == height)
      return;

    this.setState({
      width,
      height
    });
  }

  private getChildren(): JSX.Element {
    const child = React.Children.only(this.props.children);
    if (!child)
      return null;

    const newProps: React.HTMLProps<any> = {
      width: this.state.width,
      height: this.state.height
    };

    return React.cloneElement(child, newProps);
  }

  componentDidMount() {
    let parent = ReactDOM.findDOMNode(this) as HTMLElement;
    if (parent) {
      if (this.props.wrapToFlex)
        this.parent = parent.children.item(0) as HTMLElement;
      else
        this.parent = parent.parentElement;
    }

    this.updateSize();
    FitToParent.timer.addUniqueCallback(this.updateSize);
    if (!FitToParent.timer.isRunning())
      FitToParent.timer.runRepeat(100);
  }

  componentWillUnmount() {
    FitToParent.timer.removeCallback(this.updateSize);
  }

  render() {
    let el = <React.Fragment>{this.getChildren()}</React.Fragment>;
    if (this.props.wrapToFlex)
      el = (
        <div style={{position: 'relative', flexGrow: 1, ...this.props.style}}>
          <div style={{position: 'absolute', left: 0, top: 0, right: 0, bottom: 0}}>
            {el}
          </div>
        </div>
      );

    return el;
  }
}
