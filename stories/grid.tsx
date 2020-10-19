import * as React from 'react';
import { storiesOf } from '@storybook/react';
import {
  PropSheet,
  PropsGroup,
  PropItem,
  DropDownPropItem2
} from '../src/prop-sheet';
import { GridViewModel, ColAndType } from '../src/grid/grid-view-model';
import { GridView, onColumnCtxMenu } from '../src/grid/grid-view';
import { GridPanelFilter } from '../src/grid/grid-panel-filter';
import { GridArrayRequestor } from '../src/grid/grid-requestor';
import { CSSIcon } from '../src/cssicon';
import { GridApprTab, GridCardsTab } from '../src/grid/grid-tabs-appr';
import { GridPanelSort } from '../src/grid/grid-panel-sort';
import { delay } from 'bluebird';
import { Tabs, Tab } from '../src/tabs';
import { CardEditorPanel } from '../src/grid/card-editor-panel';

interface SourceRows {
  value: string;
  rows: Array< Array<string | number> >;
  cols: Array<ColAndType>;
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
    cols: [ {
      name: 'file',
      type: 'string'
    }, {
      name: 'size',
      type: 'integer'
    }, {
      name: 'type',
      type: 'string'
    } ]
  }, {
    value: 'Random data',
    rows: [],
    cols: [
      { name: 'row', type: 'integer' },
      { name: 'perc', type: 'numeric' },
      { name: 'cats1', type: 'string' },
      { name: 'cats2', type: 'string' },
      { name: 'hexRandom xxx ttt yyy  hhff fhfghf fghfgh fghfghfgh', type: 'numeric' },
      { name: 'col4', type: 'numeric' },
      { name: 'intRandom', type: 'integer' },
      { name: 'col6', type: 'numeric' }
    ],
    create: (src: SourceRows) => {
      const total = 500;

      while (src.rows.length < total)
        src.push(src);
    },
    push: (src: SourceRows) => {
      let cats = ['xxYYzz', '@####', '????', '!!!!!!', '12345', 'abc', '0', ''];
      let cats2 = ['one', 'two', 'https://assets.flatpyramid.com/wp-content/uploads/2017/09/11223302/squidward-lula-molusco-3d-model-263482.jpg', 'four', 'five', 'six', 'seven', 'eight'];
      let cols: {[col: string]: (idx: number) => string | number} = {
        row: n => n,
        hexRandom: n => Math.random().toString(16).substr(2),
        intRandom: n => Math.floor(Math.random() * n),
        cats1: n => cats[n % cats.length],
        cats2: n => cats2[n % cats2.length],
        perc: n => 0
      };
      const defaultCol = (n: number) => Math.random();
      src.rows.push(src.cols.map(c => (cols[c.name] || defaultCol)(src.rows.length)));
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
    this.model.subscribe(this.onUpdate);
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
    const cidx = src.cols.findIndex(c => c.name == 'perc');
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

  private renderProps() {
    if (this.model.getEditorMode() == 'card-editor') {
      return (
        <PropsGroup label='Card'>
          <CardEditorPanel
            model={this.model}
          />
        </PropsGroup>
      );
    }

    return (
      <>
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
            value={`${this.model.getGrid().getTotalRowsCount()} (${this.state.source?.rows.length || ''})`}
          />
          <Tabs defaultSelect='appr'>
            <Tab icon='fa fa-paint-brush' id='appr'>
              <GridApprTab
                grid={this.model.getGrid() ? this.model : undefined}
              />
            </Tab>
            <Tab icon='fa fa-id-card-o' id='card'>
              <GridCardsTab
                grid={this.model.getGrid() ? this.model : undefined}
              />
            </Tab>
          </Tabs>
        </PropsGroup>
        <PropsGroup label='Sort'>
          <GridPanelSort
            model={this.model}
          />
        </PropsGroup>
        <GridPanelFilter
          model={this.model}
        />
        <div style={{ marginRight: 5, textAlign: 'right' }}>
          <CSSIcon
            icon='fa fa-rocket'
            onClick={() => {
              this.updateProgress();
            }}
          />
        </div>
      </>
    );
  }

  render() {
    return (
      <div
        style={{
          position: 'absolute',
          left: 0, top: 0, right: 0, bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', position: 'relative', flexGrow: 1}}>
          <PropSheet defaultWidth={200} resize>
            {this.renderProps()}
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
