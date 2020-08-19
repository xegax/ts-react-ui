import * as React from 'react';
import { storiesOf } from '@storybook/react';
import { Grid, CellProps, CardProps, HeaderProps } from '../src/grid/grid';
import { GridLoadableModel } from '../src/grid/grid-loadable-model';
import { CheckIcon } from '../src/checkicon';
import {
  PropSheet,
  PropsGroup,
  PropItem,
  TextPropItem,
  SwitchPropItem,
  DropDownString
} from '../src/prop-sheet';
import { BoxLayoutEditor } from '../src/box-layout/box-layout-editor';
import { BoxLayoutEditorModel, getBoxXAxis, getBoxYAxis, getBoxRect } from '../src/box-layout/box-layout-editor-model';
import { ResizeBox } from '../src/box-layout/resizebox';
import { Box } from '../src/box-layout/box-layout-decl';
import { Subscriber } from '../src/subscriber';

let editor = new BoxLayoutEditorModel();

interface State {
  width?: number;
  height?: number;
}

class Dummy extends React.Component<{}, State> {
  state: State = {
    width: 500,
    height: 300
  };

  private renderView() {
    const { width, height } = this.state;
    return (
      <div
        style={{
          backgroundColor: 'silver',
          width,
          height,
          position: 'relative'
        }}
      >
        <ResizeBox
          rect={{
            left: 0,
            top: 0,
            right: width,
            bottom: height
          }}
          onResizing={rect => {
            const w = rect.right - rect.left;
            const h = rect.bottom - rect.top;

            this.setState({
              width: Math.floor(w / 10) * 10,
              height: Math.floor(h / 10) * 10
            });
          }}
        >
          <BoxLayoutEditor
            model={editor}
            size={{ width, height }}
          />
        </ResizeBox>
      </div>
    );
  }

  private renderBoxProps(box: Box) {
    return (
      <>
        <DropDownString
          label='X'
          values={['left', 'right', 'stretch']}
          value={getBoxXAxis(box.rect)}
          onChange={(value: 'left' | 'right' | 'stretch') => {
            const { width, height } = this.state;
            box.rect = getBoxRect({ box, x: value, contSize: { width, height } });
            editor.delayedNotify();
          }}
        />
        <DropDownString
          label='Y'
          values={['top', 'bottom', 'stretch']}
          value={getBoxYAxis(box.rect)}
          onChange={(value: 'top' | 'bottom' | 'stretch') => {
            const { width, height } = this.state;
            box.rect = getBoxRect({ box, y: value, contSize: { width, height } });
            editor.delayedNotify();
          }}
        />
      </>
    );
  }

  private renderProps = () => {
    const active = editor.getActiveBoxKey();
    const box = editor.getBoxByKey(active);
    return (
      <PropSheet defaultWidth={200} resize>
        <PropsGroup label='Floating'>
          {box ? this.renderBoxProps(box) : undefined}
        </PropsGroup>
      </PropSheet>
    );
  };

  render() {
    return (
      <div
        className='abs-fit'
        style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', position: 'relative', flexGrow: 1 }}>
          <Subscriber
            model={editor}
            render={this.renderProps}
          />
          <div style={{ position: 'relative', flexGrow: 1 }}>
            {this.renderView()}
          </div>
        </div>
        
      </div>
    );
  }
}

storiesOf('Floating rects', module)
  .add('Floating rects', () => {
    return (
      <Dummy />
    );
  });
