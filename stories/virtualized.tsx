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

interface State {
  header?: boolean;
  rnd?: number;
  rows?: number;
  cellData?: string | number;
  dataVersion?: string;
  cardsView?: boolean;
}

interface RowData {
  id: string;
  time: number;
  rnd: number;
  hexRnd: string;
  bigRnd: string;
}

interface FileData {
  _id: string;
  rIdx: number;
  name: string;
  crc: string;
  size: number;
  time: number;
  idx: number;
}

interface ObjData {
  objid: string;
  version: string;
  tm: number;
  fields: number;
  title: string;
}

function makeFileData(count: number) {
  let rows = Array<FileData>();
  const nameArr = [ 'music', 'video', 'image', 'tmp' ];
  while (rows.length < count) {
    rows.push({
      rIdx: count - rows.length,
      idx: rows.length,
      _id: 'id-' + rows.length,
      name: nameArr[rows.length % nameArr.length] + '-' + rndHex(),
      crc: rndHex(),
      size: Math.round(50 + Math.random() * 100000),
      time: Date.now()
    });
  }

  let cols: Array<keyof FileData> = [
    'rIdx',
    'idx',
    '_id',
    'name',
    'crc',
    'size',
    'time'
  ];

  return {
    rows,
    cols: cols as Array<string>
  };
}

function makeRowData(count: number) {
  let rows = Array<RowData>();
  while (rows.length < count) {
    let raw: RowData = {
      id: '' + rows.length,
      time: Date.now(),
      rnd: Math.random(),
      hexRnd: rndHex(),
      bigRnd: [
        rndHex(31),
        rndHex(31),
        rndHex(31)
      ].join('-')
    };
    rows.push(raw);
  }
  
  let cols: Array<keyof RowData> = [
    'id',
    'time',
    'rnd',
    'hexRnd',
    'bigRnd'
  ];

  return {
    rows,
    cols: cols as Array<string>
  };
}

function makeObjData(count: number) {
  let rows = Array<ObjData>();
  while (rows.length < count) {
    rows.push({
      objid: rndHex(),
      version: [ rndHex(31), rndHex(31) ].join('-'),
      tm: Date.now(),
      fields: Math.round(Math.random() * 5),
      title: [ 'name', rndHex(31), rndHex(31) ].join('-')
    });
  }

  let cols: Array<keyof ObjData> = [
    'objid',
    'version',
    'tm',
    'fields',
    'title'
  ];

  return {
    rows,
    cols: cols as Array<string>
  };
}

function rndHex(s = 16) {
  return Math.random().toString(s).substr(2);
}

let remoteData = {
  rnd: makeRowData(3),
  files: makeFileData(50),
  objs: makeObjData(300)
};

const sources = Object.keys(remoteData)
  .map(value => {
    return { value };
  });

const selection = [
      {
        value: 'none'
      }, {
        value: 'rows'
      }, {
        value: 'cells'
      }
];

class Dummy extends React.Component<{}, State> {
  state: State = { rnd: Math.random() };
  rows = Array<Object>();
  cols = Array<string>();
  dataKey: string; 
  model: GridLoadableModel;

  onUpdate = () => {
    this.setState({});
  }

  onSelect = () => {
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
  }

  setSource(rows: Array<Object>, cols: Array<string>) {
    if (this.model) {
      this.model.unsubscribe(this.onUpdate);
      this.model.unsubscribe(this.onSelect, 'select');
    }

    this.rows = rows;
    this.cols = cols;
    this.model = new GridLoadableModel({
      rowsCount: rows.length,
      colsCount: cols.length,
      prev: this.model
    });
    this.model.subscribe(this.onUpdate);
    this.model.subscribe(this.onSelect, 'select');

    this.model.setLoader((from, count) => {
      return (
        (Promise.delay(1000) as any as Promise<void>)
        .then(() => {
          const rawArr = this.rows.slice(from, from + count);
          return rawArr.map(obj => ({ obj }));
        })
      );
    });
    this.setState({});
  }

  renderCard = (props: CardProps) => {
    const rowObj = this.model.getRowOrLoad(props.row);
    if (!rowObj)
      return;

    return rowObj.cell[0];
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
    if (!this.model)
      return null;

    return (
      <Grid
        cardsView={this.state.cardsView}
        model={this.model}
        headerBorder
        renderHeader={this.renderHeader}
        renderCell={this.renderCell}
        renderCard={this.renderCard}
        onScrollToBottom={() => {
          this.model.loadNext();
        }}
      />
    );
  }

  render() {
    const grid = this.model;

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
                value={sources.find(v => v.value == this.dataKey)}
                values={sources}
                onSelect={item => {
                  this.dataKey = item.value;
                  this.setSource(
                    remoteData[item.value].rows,
                    remoteData[item.value].cols
                  );
                }}
              />
              {grid && <>
                <PropItem
                  label='Rows'
                  value={grid.getTotalRowsCount()}
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
                  label='Cards view'
                  value={this.state.cardsView}
                  onChanged={() => {
                    this.setState({ cardsView: !this.state.cardsView})
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
                <DropDownPropItem2
                  label='Select'
                  value={selection.find(v => v.value == grid.getSelectType())}
                  values={selection}
                  onSelect={v => grid.setSelectType(v.value as any)}
                />
                <TextPropItem
                  value={this.state.cellData}
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

storiesOf('Virtualized', module)
  .add('Grid', () => {
    return (
      <Dummy />
    );
  });
