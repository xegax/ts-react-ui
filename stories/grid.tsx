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
import { GridView } from '../src/grid/grid-view';
import { GridArrayRequestor } from '../src/grid/grid-requestor';

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
    cols: ['row', 'cats1', 'hexRandom', 'col4', 'intRandom', 'col6'],
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
      />
    );
  }

  render() {
    const m = this.model;
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
              {grid && <>
                <PropItem
                  label='Rows'
                  value={this.state.source?.rows.length || 0}
                />
                <SwitchPropItem
                  label='Border'
                  value={grid.getBodyBorder()}
                  onChanged={() => {
                    grid.setBodyBorder(!grid.getBodyBorder());
                  }}
                />
                <SwitchPropItem
                  label='Header'
                  value={grid.getHeader()}
                  onChanged={() => {
                    grid.setHeader(!grid.getHeader());
                  }}
                />
                <TextPropItem
                  label='Header size'
                  show={grid.getHeader()}
                  value={grid.getHeaderSize()}
                  onEnter={v => {
                    grid.setHeaderSize(+v);
                  }}
                />
                <TextPropItem
                  label='Row size'
                  value={grid.getRowSize()}
                  onEnter={v => {
                    grid.setRowSize(+v);
                  }}
                />
                <SwitchPropItem
                  label='Reverse'
                  value={grid.getReverse()}
                  onChanged={() => {
                    grid.setReverse(!grid.getReverse());
                  }}
                />
                <SwitchPropItem
                  label='Autosize'
                  value={grid.getAutosize()}
                  onChanged={() => {
                    grid.setAutosize(!grid.getAutosize());
                  }}
                />
                <SwitchPropItem
                  label='Card border'
                  value={grid.getCardBorder()}
                  onChanged={v => {
                    grid.setCardBorder(v);
                  }}
                />
                <TextPropItem
                  label='Card width'
                  value={grid.getCardWidth()}
                  onEnter={v => {
                    grid.setCardWidth(+v);
                  }}
                />
                <TextPropItem
                  label='Card height'
                  value={grid.getCardHeight()}
                  onEnter={v => {
                    grid.setCardHeight(+v);
                  }}
                />
                <TextPropItem
                  label='Cards per rows'
                  value={grid.getCardsPerRow()}
                  onEnter={v => {
                    grid.setCardsPerRow(+v);
                  }}
                />
                <TextPropItem
                  label='Cards padding'
                  value={grid.getCardsPadding()}
                  onEnter={v => {
                    grid.setCardsPadding(+v);
                  }}
                />
              </>}
            </PropsGroup>
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
