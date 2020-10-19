import * as React from 'react';
import { Box } from './box-layout-decl';

export interface RenderBoxResult {
  jsx?: React.ReactNode;
  tip?: string;
  style?: React.CSSProperties;
  className?: string;
}

interface Props<T = any> {
  boxArr: Array<Box>;
  data?: T;
  renderBox?(box: Box, data?: T): RenderBoxResult;
  wrapBox?(jsx: React.ReactChild, box: Box): React.ReactChild;
}

export class BoxLayout<T = any> extends React.Component<Props<T>> {
  private wrapBox(jsx: React.ReactChild, box: Box) {
    if (this.props.wrapBox)
      return this.props.wrapBox(jsx, box);

    return jsx;
  }

  private renderBox = (box: Box, key: string | number) => {
    const res: RenderBoxResult = box.key ? { ...this.props.renderBox?.(box, this.props.data) } : {};
    return (
      this.wrapBox(
        <div
          key={box.key || key}
          className={res.className}
          style={{
            ...res.style,
            position: 'absolute',
            ...box.rect
          }}
          title={res.tip}
        >
          {res.jsx}
          {box.children?.map((child, i) => this.renderBox(child, [key, i].join('-')))}
        </div>,
        box
      )
    );
  }

  render() {
    return (
      <div className='abs-fit'>
        {this.props.boxArr.map(this.renderBox)}
      </div>
    );
  }
}
