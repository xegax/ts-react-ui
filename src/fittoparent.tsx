import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Timer } from 'objio/common/timer';

export interface State {
  width?: number;
  height?: number;
}

export interface Props extends React.HTMLProps<any> {
  wrapToFlex?: boolean;
  calcW?: boolean;
  calcH?: boolean;
  render?(width: number, height: number): JSX.Element;
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

    let width = clientWidth - paddingX;
    let height = clientHeight - paddingY;
    if (this.state.width == width && this.state.height == height)
      return;

    width = width || this.state.width;
    height = height || this.state.height;
    this.setState({
      width,
      height
    });
  }

  private getChildren(): JSX.Element {
    let child = this.props.children && React.Children.only(this.props.children);

    if (!child && this.props.render)
      return this.props.render(this.state.width, this.state.height);

    if (!child)
      return null;

    const newProps: React.HTMLProps<any> = {};
    if (this.props.calcW != false)
      newProps.width = this.state.width;
    
    if (this.props.calcH != false)
      newProps.height = this.state.height;

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
    let el = <>{this.getChildren()}</>;
    if (this.props.wrapToFlex) {
      el = (
        <div style={{position: 'relative', flexGrow: 1, ...this.props.style}}>
          <div style={{position: 'absolute', left: 0, top: 0, right: 0, bottom: 0}}>
            {el}
          </div>
        </div>
      );
    }

    return el;
  }
}
