import * as React from 'react';
import { Box } from './box-layout-decl';

interface RenderBoxResult {
  jsx?: JSX.Element;
  style?: React.CSSProperties;
}

interface Props {
  boxArr: Array<Box>;
  renderBox?(box: Box): RenderBoxResult;
  wrapBox?(jsx: React.ReactChild, box: Box): React.ReactChild;
}

export class BoxLayout extends React.Component<Props> {
  private wrapBox(jsx: React.ReactChild, box: Box) {
    if (this.props.wrapBox)
      return this.props.wrapBox(jsx, box);

    return jsx;
  }

  private renderBox = (box: Box, key: string | number) => {
    const res: RenderBoxResult = box.key ? { ...this.props.renderBox?.(box) } : {};
    return (
      this.wrapBox(
        <div
          key={box.key || key}
          style={{
            ...res.style,
            position: 'absolute',
            ...box.rect
          }}
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
