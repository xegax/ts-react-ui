import * as React from 'react';
import { storiesOf } from '@storybook/react';
import { Grid } from '../src/grid';
import { GridLoadable, Row } from '../src/grid-loadable';
import { CheckIcon } from '../src/checkicon';

interface State {
  autoresize?: boolean;
  header?: boolean;
  rnd?: number;
}

class Dummy extends React.Component<{}, State> {
  state: State = { rnd: Math.random() };
  ref = React.createRef<Grid>();
  colSize: {[c: string]: number} = {};

  renderButtons() {
    return (
      <div className='horz-panel-1'>
        <button>
          reverse
        </button>
        <button onClick={() => { }}>
          cards
        </button>
        <button onClick={() => { }}>
          list
        </button>
        <button onClick={() => {
            this.setState({ rnd: Math.random() }, () => {
              this.ref.current.ref.current.forceUpdateGrids();
            });
          }}>
          update tems data
        </button>
        <button onClick={() => this.setState({ autoresize: !this.state.autoresize })}>
          autoresize
        </button>
        <button onClick={() => this.setState({ header: !this.state.header })}>
          header
        </button>
      </div>
    );
  }

  renderView() {
    return (
      <Grid
        ref={this.ref}
        autoresize={this.state.autoresize}
        headerBorder
        bodyBorder
        rowsCount={50000}
        colsCount={5}
        renderHeader={this.state.header ? props => {
          return (
            <>
              <CheckIcon
                value
                showOnHover
                faIcon='fa fa-futbol-o'
              />
              <span>col {props.col}</span>
            </>
          );
        } : null }
        renderCell={props => {
          const rnd = Math.round(this.state.rnd * 100) / 100;
          return <div style={{ width: '100%', textAlign: 'center' }}>{props.row + 'x' + props.col} {rnd}</div>;
        }}
        /*setColumnSize={(col, size) => {
          this.colSize[col] = size;
        }}
        getColumnSize={col => this.colSize[col]}*/
      />
    );
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
        {this.renderButtons()}
        <div style={{ position: 'relative', flexGrow: 1}}>
          {this.renderView()}
        </div>
      </div>
    );
  }
}

interface ColumnData {
  id: string;
  label: string;
  getData: (row: number) => string;
}

const allCols: Array<ColumnData> = [
  {
    id: 'id',
    label: 'id',
    getData: row => {
      return 'id-' + row
    }
  }, {
    id: 'time',
    label: 'time',
    getData: () => {
      return '' + Date.now()
    }
  }, {
    id: 'rnd',
    label: 'rnd',
    getData: () => {
      return '' + Math.random()
    }
  }, {
    id: 'rnd-16',
    label: 'rnd-16',
    getData: () => {
      return Math.random().toString(16).substr(2);
    }
  }
];

const colsScheme = [
  { name: 'id, time, rnd, rnd-16', cols: allCols.slice() },
  { name: 'id,rnd,time', cols: [ allCols[0], allCols[2], allCols[1] ] },
  { name: 'rnd-16,time,id', cols: [ allCols[3], allCols[1], allCols[0] ] },
  { name: 'time', cols: [ allCols[1] ] }
];

class DummyLoadable extends React.Component<{}, State> {
  state: State = { header: true };
  cols = allCols.slice();
  ref = React.createRef<GridLoadable>();

  renderButtons() {
    return (
      <div className='horz-panel-1'>
        <button>
          reverse
        </button>
        <button onClick={() => { }}>
          cards
        </button>
        <button onClick={() => { }}>
          list
        </button>
        <button>
          update tems data
        </button>
        <button onClick={() => this.setState({ autoresize: !this.state.autoresize })}>
          autoresize
        </button>
        <button onClick={() => this.setState({ header: !this.state.header })}>
          header
        </button>
        <select onChange={e => {
          this.cols = colsScheme[+e.target.value].cols;
          this.ref.current.getModel().reload({ cols: this.cols.length });
        }}>
          {colsScheme.map((cols, i) => <option value={i}>{cols.name}</option>)}
        </select>
      </div>
    );
  }

  renderView() {
    return (
      <GridLoadable
        ref={this.ref}
        rowsCount={15}
        colsCount={this.cols.length}
        loader={(from, count) => {
          return (
            (Promise.delay(1) as any as Promise<void>)
            .then(() => {
              let arr = Array<Row>();
              for (let n = 0; n < count; n++) {
                const idx = from + n;
                let row: Row = {};
                this.cols.forEach(col => {
                  row[col.id] = col.getData(idx);
                });
                arr.push(row);
              }
              return Promise.resolve(arr);
            })
          );
        }}
        renderHeader={this.state.header ? props => {
          return (
            <>
              <CheckIcon
                value
                showOnHover
                faIcon='fa fa-futbol-o'
              />
              <span>{this.cols[props.col].label}</span>
            </>
          );
        } : null }
        renderCell={props => {
          return <div style={{ width: '100%', textAlign: 'center' }}>{props.data}</div>;
        }}
      />
    );
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
        {this.renderButtons()}
        <div style={{ position: 'relative', flexGrow: 1}}>
          {this.renderView()}
        </div>
      </div>
    );
  }
}

storiesOf('Virtualized', module)
  .add('Grid', () => {
    return (
      <Dummy />
    );
  })
  .add('Grid loadable', () => {
    return (
      <DummyLoadable />
    );
  });
