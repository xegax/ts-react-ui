import * as React from 'react';
import { storiesOf } from '@storybook/react';
import { Grid, GridModel, CellProps, HeaderProps } from '../src/grid/grid';
import { GridLoadableModel, Row as Row2 } from '../src/grid/grid-loadable-model';
import { GridLoadable, Row } from '../src/grid/grid-loadable';
import { CheckIcon } from '../src/checkicon';
import {
  PropSheet,
  PropsGroup,
  PropItem,
  TextPropItem,
  SwitchPropItem,
  DropDownPropItem
} from '../src/prop-sheet';

interface State {
  header?: boolean;
  rnd?: number;
  rows?: number;
  cellData?: string | number;
  dataVersion?: string;
}

interface RowData {
  id: string;
  time: number;
  rnd: number;
  hexRnd: string;
  bigRnd: string;
}

function rndHex() {
  return Math.random().toString(16).substr(2);
}

let idCounter = 0;
let remoteData = Array<RowData>();
let remoteDataVersion = rndHex();
for (let n = 0; n < 500; n++) {
  let raw: RowData = {
    id: '' + idCounter++,
    time: Date.now(),
    rnd: Math.random(),
    hexRnd: rndHex(),
    bigRnd: [
      Math.random().toString(31).substr(2),
      Math.random().toString(31).substr(2),
      Math.random().toString(31).substr(2)
    ].join('-')
  };
  remoteData.push(raw);
}

class Dummy extends React.Component<{}, State> {
  state: State = { rnd: Math.random(), };
  cols: Array<keyof RowData> = [ 'id', 'time', 'rnd', 'hexRnd', 'bigRnd' ];
  model = new GridLoadableModel<RowData>();

  constructor(props) {
    super(props);

    // this.model.setReverse(true);
    this.model.subscribe(() => {
      this.setState({});
    });

    this.model.setRowsCount(remoteData.length);
    this.model.setLoader((from, count) => {
      return (
        (Promise.delay(1) as any as Promise<void>)
        .then(() => this.getRows(from, count))
      );
    });
    this.model.subscribe(() => {
      const sel = this.model.getSelectCells();
      const rows = Object.keys(sel);
      if (!rows.length)
        return;

      const curCol = this.model.getColFocus();
      const curRow = this.model.getRowFocus();
      const cursor = {
        cellData: this.model.getRow(curRow).cell[ curCol ] || ''
      };

      this.setState(cursor);
    }, 'select');
  }

  getRows(from: number, count: number): Array< Row2<RowData> > {
    const rawArr = remoteData.slice(from, from + count);
    return rawArr.map(obj => ({ obj }));
  }

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
              this.model.render();
            });
          }}>
          update items data
        </button>
      </div>
    );
  }

  renderCell = (props: CellProps) => {
    const rnd = Math.round(this.state.rnd * 100) / 100;
    const rowObj = this.model.getRowOrLoad(props.row);
    if (!rowObj)
      return;

    let cell = rowObj.cell[props.col];
    return (
      <div style={{ width: '100%', textAlign: 'center' }}>
        {cell} {rnd}
      </div>
    );
  };

  renderHeader = (props: HeaderProps) => {
    return (
      <>
        <CheckIcon
          value
          showOnHover
          faIcon='fa fa-futbol-o'
        />
        <span>{this.cols[props.col]}</span>
      </>
    );
  };

  renderView() {
    return (
      <Grid
        model={this.model}
        headerBorder
        colsCount={this.cols.length}
        renderHeader={this.renderHeader}
        renderCell={this.renderCell}
        onScrollToBottom={() => {
          this.model.loadNext();
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
        <div style={{ display: 'flex', position: 'relative', flexGrow: 1}}>
          <PropSheet defaultWidth={200} resize>
            <PropsGroup label='grid'>
              <PropItem
                label='rows'
                value={this.model.getRowsCount()}
              />
              <SwitchPropItem
                label='border'
                value={this.model.getBodyBorder()}
                onChanged={() => {
                  this.model.setBodyBorder(!this.model.getBodyBorder());
                }}
              />
              <SwitchPropItem
                label='header'
                value={this.model.getHeader()}
                onChanged={() => {
                  this.model.setHeader(!this.model.getHeader());
                }}
              />
              <TextPropItem
                label='header size'
                show={this.model.getHeader()}
                value={this.model.getHeaderSize()}
                onEnter={v => {
                  this.model.setHeaderSize(+v);
                }}
              />
              <TextPropItem
                label='row size'
                value={this.model.getRowSize()}
                onEnter={v => {
                  this.model.setRowSize(+v);
                }}
              />
              <SwitchPropItem
                label='reverse'
                value={this.model.getReverse()}
                onChanged={() => {
                  this.model.setReverse(!this.model.getReverse());
                }}
              />
              <SwitchPropItem
                label='autosize'
                value={this.model.getAutosize()}
                onChanged={() => {
                  this.model.setAutosize(!this.model.getAutosize());
                }}
              />
              <DropDownPropItem
                label='select'
                value={{ value: this.model.getSelectType() }}
                values={[
                  {
                    value: 'none'
                  }, {
                    value: 'rows'
                  }, {
                    value: 'cells'
                  }
                ]}
                onSelect={v => this.model.setSelectType(v.value as any)}
              />
              <TextPropItem
                value={this.state.cellData}
                onEnter={v => {
                  const row = this.model.getRowFocus(true);

                  const col = this.model.getColFocus();
                  const prev = remoteData[row][ this.cols[col] ];
                  if (prev == v)
                    return;

                  remoteData[row][ this.cols[col] ] = v;
                  this.model.reloadCurrent();
                }}
              />
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
          update items data
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
        rowsCount={50}
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
