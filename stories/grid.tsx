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
  DropDownPropItem2
} from '../src/prop-sheet';
import { GridViewModel } from '../src/grid/grid-view-model';
import { GridView, onColumnCtxMenu } from '../src/grid/grid-view';
import { GridArrayRequestor } from '../src/grid/grid-requestor';
import { CSSIcon } from '../src/cssicon';
import { GridViewAppr } from '../src/grid/grid-view-appr';
import { GridApprPanel } from '../src/grid/grid-appr-panel';

interface SourceRows {
  value: string;
  rows: Array< Array<string | number> >;
  cols: Array<string>;
  create?(src: SourceRows): Array< Array<string | number> >;
}

let sources: Array<SourceRows> = [
  {
    value: 'Simple data 1',
    rows: [
      [ 'fb2.json', 500, '.json' ],
      [ 'image.bpm', 90000, '.bmp'],
      [ 'title.jpg', 10000000, '.jpg'],
      [ 'temp', 0, '' ]
    ],
    cols: [ 'file', 'size', 'type' ]
  }, {
    value: 'Random data',
    rows: [],
    cols: ['row', 'cats1', 'hexRandom xxx ttt yyy  hhff fhfghf fghfgh fghfghfgh', 'col4', 'intRandom', 'col6'],
    create: (src: SourceRows) => {
      const total = 10000;

      let cats = ['xxYYzz', '@####', '????', '!!!!!!', '12345', 'abc', '0', ''];
      let cols: {[col: string]: (idx: number) => string | number} = {
        row: n => n,
        hexRandom: n => Math.random().toString(16).substr(2),
        intRandom: n => Math.floor(Math.random() * n),
        cats1: n => cats[Math.floor(Math.random() * (cats.length - 1))]
      };
      const defaultCol = (n: number) => Math.random();
 
      let rows = [];
      while (rows.length < total) {
        rows.push( src.cols.map(c => (cols[c] || defaultCol)(rows.length)) );
      }

      return rows;
    }
  }
];

interface State {
  source?: SourceRows;
}

let appr: Partial<GridViewAppr> = {};
class Dummy extends React.Component<{}, State> {
  model = new GridViewModel();
  state: State = {};

  onUpdate = () => {
    this.setState({});
  }

  private setSource = (source: SourceRows) => {
    if (source.create && !source.rows.length)
      source.rows = source.create(source);

    this.model.setRequestor(new GridArrayRequestor(source));
    this.setState({ source });
  }

  private renderView() {
    if (!this.model)
      return null;

    return (
      <GridView
        model={this.model}
        onColumnCtxMenu={onColumnCtxMenu}
      />
    );
  }

  render() {
    const m = this.model;
    const currAppr = m.getAppr();
    const grid = m.getGrid();

    return (
      <div style={{
          position: 'absolute',
          left: 0, top: 0, right: 0, bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', position: 'relative', flexGrow: 1}}>
          <PropSheet defaultWidth={200} resize>
            <PropsGroup label='Grid'>
              <DropDownPropItem2
                label='Source'
                value={this.state.source}
                values={sources}
                onSelect={this.setSource}
              />
            </PropsGroup>
            <GridApprPanel
              grid={this.model.getGrid() ? this.model : undefined}
            />
          </PropSheet>
          <div style={{ position: 'relative', flexGrow: 1 }}>
            {this.renderView()}
          </div>
        </div>
      </div>
    );
  }
}

storiesOf('Grid', module)
  .add('Grid', () => {
    return (
      <Dummy />
    );
  });
