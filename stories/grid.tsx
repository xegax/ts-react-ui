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
import { GridPanelAppr } from '../src/grid/grid-panel-appr';
import { GridPanelSort } from '../src/grid/grid-panel-sort';
import { delay } from 'bluebird';

interface SourceRows {
  value: string;
  rows: Array< Array<string | number> >;
  cols: Array<string>;
  create?(src: SourceRows);
  push?(src: SourceRows);
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
    cols: ['row', 'perc', 'cats1', 'hexRandom xxx ttt yyy  hhff fhfghf fghfgh fghfghfgh', 'col4', 'intRandom', 'col6'],
    create: (src: SourceRows) => {
      const total = 500;

      while (src.rows.length < total)
        src.push(src);
    },
    push: (src: SourceRows) => {
      let cats = ['xxYYzz', '@####', '????', '!!!!!!', '12345', 'abc', '0', ''];
      let cols: {[col: string]: (idx: number) => string | number} = {
        row: n => n,
        hexRandom: n => Math.random().toString(16).substr(2),
        intRandom: n => Math.floor(Math.random() * n),
        cats1: n => cats[Math.floor(Math.random() * (cats.length - 1))],
        perc: n => 0
      };
      const defaultCol = (n: number) => Math.random();
      src.rows.push(src.cols.map(c => (cols[c] || defaultCol)(src.rows.length)));
    }
  }
];

interface State {
  source?: SourceRows;
}

class Dummy extends React.Component<{}, State> {
  model = new GridViewModel();
  state: State = {};

  onUpdate = () => {
    this.setState({});
  }

  private setSource = (source: SourceRows) => {
    if (source.create && !source.rows.length)
      source.create(source);

    this.model.setRequestor(new GridArrayRequestor(source));
    this.model.setAllColumns(source.cols);
    this.setState({ source });
  }

  private renderView() {
    if (!this.model)
      return null;

    const colRenderer = {
      'perc': v => {
        return `${Math.round(v * 100)}%`;
      }
    };

    return (
      <GridView
        model={this.model}
        onColumnCtxMenu={onColumnCtxMenu}
        customRender={colRenderer}
      />
    );
  }

  updateProgress() {
    const src = this.state.source;
    const m = this.model;
    const cidx = src.cols.indexOf('perc');
    if (cidx == -1)
      return Promise.resolve();
  
    let rowIdx = Math.round(Math.random() * (src.rows.length - 1));
    const row = src.rows[rowIdx] as Array<number>;
    row[cidx] = Math.min(row[cidx] + 0.1, 1);
    if (row[cidx] == 1) {
      src.rows.splice(0, 1);
      this.setState({});
    }
    m.reloadCurrent();
  
    if (!src.rows.length)
      return Promise.resolve();
  
    return delay(100).then(() => this.updateProgress());
  }

  render() {
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
            <PropsGroup label='Grid' padding={false}>
              <DropDownPropItem2
                margin
                label='Source'
                value={this.state.source}
                values={sources}
                onSelect={this.setSource}
              />
              <PropItem
                label='Rows'
                value={'' + (this.state.source?.rows.length || '')}
              />
              <GridPanelAppr
                grid={this.model.getGrid() ? this.model : undefined}
              />
            </PropsGroup>
            <PropsGroup label='Sort'>
              <GridPanelSort
                model={this.model}
              />
            </PropsGroup>
            <div style={{ marginRight: 5, textAlign: 'right' }}>
              <CSSIcon
                icon='fa fa-rocket'
                onClick={() => {
                  this.updateProgress();
                }}
              />
            </div>
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
