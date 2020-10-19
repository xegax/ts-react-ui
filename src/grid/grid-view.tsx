import * as React from 'react';
import { GridViewModel } from './grid-view-model';
import { Grid, CellProps, HeaderProps, CardProps } from './grid';
import { showMenu, IMenuItem, ISubmenuItem } from '../menu';
import { prompt } from '../prompt';
import { getStyleFromAppr } from '../common/font-appr';
import { CSSIcon } from '../cssicon';
import { Progress } from '../progress';
import { BoxLayoutEditor } from '../box-layout/box-layout-editor';
import { BoxLayout, RenderBoxResult } from '../box-layout/box-layout';
import { ResizeBox } from '../box-layout/resizebox';
import { Subscriber } from '../subscriber';
import { Box } from '../box-layout/box-layout-decl';
import { Row2 } from './grid-loadable-model';
import { ContentValue } from './grid-view-appr';

function getContString(c: Partial<ContentValue> | undefined, cols: Array<string>, row: Array<string | number>) {
  if (!c || c.type == 'none')
    return '';

  if (c.type == 'custom')
    return c.custom == null ? '' : `${c.custom}`;

  const v = row[cols.indexOf(c.value)];
  return v == null ? '' : `${v}`;
}

const imageExts = ['.gif', '.jpeg', '.jpg', '.png', '.svg'];
export interface RenderIconArgs {
  col: string;
  icon: string;
}

interface Props {
  model?: GridViewModel;
  onColumnCtxMenu?(model: GridViewModel, col: string): Array<ISubmenuItem | IMenuItem>;
  renderIcon?(args: RenderIconArgs): JSX.Element;
  customRender?: Record<string, ((value: string | number, col: string) => React.ReactChild)>;
}

export class GridView extends React.Component<Props> {
  private subscriber = () => {
    this.setState({});
  };

  componentDidMount() {
    this.props.model.subscribe(this.subscriber);
  }

  componentWillUnmount() {
    this.props.model.unsubscribe(this.subscriber);
  }

  private renderCell = (p: CellProps) => {
    const m = this.props.model.getGrid();
    const row = m.getRowOrLoad(p.row);
    if (!row)
      return null;

    const cols = this.props.model.getViewColumns();
    const colName = cols[p.col];

    const appr = this.props.model.getAppr();
    const style = getStyleFromAppr({...appr.body.font, ...appr.columns[colName]?.font});
    style.overflow = 'hidden';
    style.textOverflow = 'ellipsis';

    let cell = row.cell[p.col];
    return (
      <div style={style}>
        {this.props.customRender?.[colName]?.(cell, colName) ?? cell}
      </div>
    );
  }

  private enterToCardEditor(row: number) {
    this.props.model.setEditorMode('card-editor');
    this.props.model.setEditRow(row);
    const { boxArr, width, height } = this.props.model.getAppr().cardsView;
    this.props.model.getCardEditor().setBoxArr(boxArr);
    this.setState({ cardSize: { width, height } });
  };

  private saveCardEditor = () => {
    this.props.model.setEditorMode('grid');
    this.props.model.setApprChange({
      cardsView: {
        boxArr: this.props.model.getCardEditor().getBoxArr()
      }
    });
    this.setState({ cardSize: undefined });
  };

  private renderCard = (p: CardProps) => {
    const m = this.props.model.getGrid();
    const row = m.getRowOrLoad(p.row);
    if (!row)
      return null;

    const appr = this.props.model.getAppr();
    p.style = { backgroundColor: appr.cardsView.color };
    return (
      <div className='abs fit-to-abs' onDoubleClick={() => this.enterToCardEditor(p.row)}>
        <BoxLayout<Row2<Object>>
          boxArr={appr.cardsView.boxArr}
          data={row}
          renderBox={this.renderBox}
        />
      </div>
    );
  }

  private renderIcon(args: RenderIconArgs) {
    if (!this.props.renderIcon) {
      return (
        <CSSIcon
          displayFlex={false}
          icon={args.icon}
        />
      );
    }

    return this.props.renderIcon(args);
  }

  private renderHeader = (header: HeaderProps) => {
    const cols = this.props.model.getViewColumns();
    const colName = cols[header.col];

    header.wrapperProps.onClick = () => {
      this.props.model.toggleSorting(colName);
    };

    header.wrapperProps.onContextMenu = evt => {
      if (!this.props.onColumnCtxMenu)
        return;

      evt.preventDefault();
      evt.stopPropagation();

      showMenu(
        { left: evt.pageX, top: evt.pageY },
        this.props.onColumnCtxMenu(this.props.model, colName)
      );
    };

    const appr = this.props.model.getAppr();
    const col = appr.columns[colName] || {};
    let sortIcon: JSX.Element | undefined;
    const sortCol = appr.sort.columns.find(c => c.name == colName);
    if (sortCol) {
      sortIcon = (
        <CSSIcon
          displayFlex={false}
          icon={sortCol.asc ? 'fa fa-angle-down' : 'fa fa-angle-up'}
        />
      );
    }

    return (
      <span
        style={{ ...getStyleFromAppr(appr.header.font), justifyContent: 'center' }}
        className='horz-panel-1 flex'
      >
        {col.icon || this.props.renderIcon ? this.renderIcon({ icon: col.icon, col: colName }) : undefined}
        <div style={{ textOverflow: 'ellipsis', overflowX: 'hidden' }}>{col.label || colName}</div>
        {sortIcon}
      </span>
    );
  }

  private renderGrid() {
    const m = this.props.model.getGrid();
    return (
      <Grid
        model={m}
        renderCell={this.renderCell}
        renderHeader={this.renderHeader}
        renderCard={this.renderCard}
        onScrollToBottom={() => {
          m.loadNext();
        }}
      />
    );
  }

  private renderBox = (box: Box, row: Row2<Object>) => {
    const appr = this.props.model.getAppr().cardsView;
    const currBoxAppr = {...appr.boxMap[box.key]};
    const boxAppr = {...appr.boxAppr, ...currBoxAppr};
    const cols = this.props.model.getViewColumns();

    const cont = getContString({ type: 'custom', ...boxAppr.content }, cols, row.cell);
    const href = getContString({ type: 'custom', ...boxAppr.href }, cols, row.cell);
    const tip = getContString({ type: 'custom', ...boxAppr.tooltip }, cols, row.cell);

    const style: React.CSSProperties = {
      ...getStyleFromAppr({...appr.boxAppr.font, ...currBoxAppr.font}),
      backgroundColor: boxAppr.background,
      border: boxAppr.border ? '1px solid gray' : undefined,
      padding: boxAppr.padding || 0,
      textOverflow: 'ellipsis'
    };
    if (['auto', 'scroll'].indexOf(boxAppr.overflow) != -1)
      style.overflowY = boxAppr.overflow;
    else
      style.overflow = boxAppr.overflow;

    let jsx: React.ReactChild = cont;
    if (currBoxAppr.contentType == 'image' || (currBoxAppr.contentType == 'auto' && imageExts.some(ext => cont.endsWith(ext)))) {
      jsx = (
        <div
          className='abs fit-to-abs'
          dangerouslySetInnerHTML={{
            __html: `<img style="width: 100%; height: 100%; object-fit: scale-down; padding: ${style.padding}px" referrerPolicy="no-referrer" src="${cont}"/>`
          }}
        />
      );
    }

    if (href)
      jsx = <a href={href} target={this.props.model.getLinkTgt()}>{jsx}</a>;
    
    const res: RenderBoxResult = {
      jsx,
      className: 'abs-fit',
      style,
      tip
    };

    return res;
  };

  private renderCardEditorToolbar = () => {
    const editor = this.props.model.getCardEditor();
    return (
      <div style={{ flexGrow: 0, backgroundColor: '#e4e4e4' }} className='horz-panel-1 padding'>
        <CSSIcon
          title='Save'
          icon='fa fa-save'
          onClick={this.saveCardEditor}
        />
        <CSSIcon
          icon='fa fa-trash'
          title='Remove selected'
          disabled={editor.getSelectNum() == 0}
          onClick={() => editor.deleteByKeys(new Set(editor.getSelectedKeys()))}
        />
        <CSSIcon
          icon='fa fa-arrow-up'
          title='Move forward'
          onClick={() => editor.moveTo('forward')}
        />
        <CSSIcon
          icon='fa fa-arrow-down'
          title='Move backward'
          onClick={() => editor.moveTo('backward')}
        />
      </div>
    );
  };

  private renderCardEditor = () => {
    const editor = this.props.model.getCardEditor();
    const appr = this.props.model.getAppr();
    const size = { width: appr.cardsView.width, height: appr.cardsView.height };
    const columns = this.props.model.getAllColumns();

    return (
      <>
        {this.renderCardEditorToolbar()}
        <div className='padding' style={{ position: 'relative', flexGrow: 1, backgroundColor: 'gray' }}>
          <div style={{ position: 'absolute', ...size, backgroundColor: 'white' }}>
            <ResizeBox
              rect={{
                left: 0,
                top: 0,
                right: size.width,
                bottom: size.height
              }}
              onResizing={rect => {
                const w = rect.right - rect.left;
                const h = rect.bottom - rect.top;
                this.props.model.setApprChange({
                  cardsView: {
                    width: Math.floor(w / 10) * 10,
                    height: Math.floor(h / 10) * 10
                  }
                });
              }}
            >
              <BoxLayoutEditor
                size={size}
                model={this.props.model.getCardEditor()}
                data={this.props.model.getGrid().getRowOrLoad(this.props.model.getEditRow())}
                renderBox={this.renderBox}
                createBox={box => {
                  this.props.model.setApprChange({
                    cardsView: {
                      boxMap: {[box.key]: { content: { type: 'table', value: columns[0] } } }
                    }
                  });
                }}
              />
            </ResizeBox>
          </div>
        </div>
      </>
    );
  }

  render() {
    const m = this.props.model;
    if (!m.getRequestor())
      return null;

    return (
      <div className='abs-fit flexcol'>
        {m.isInProgress() ? <Progress/> : undefined}
        {m.getEditorMode() == 'grid' ? (
            this.renderGrid()
          ) : (
            <Subscriber
              render={this.renderCardEditor}
              model={m.getCardEditor()}
            />
          )}
      </div>
    );
  }
}


export function onColumnCtxMenu(model: GridViewModel, colName: string): Array<IMenuItem | ISubmenuItem> {
  const cols = model.getViewColumns();
  const colsSet = new Set(cols);

  const moveCol = (dir: 'after' | 'before') => {
    return (
      cols.filter(col => col != colName)
      .map(beforeCol => {
        return {
          name: beforeCol,
          cmd: () => {
            model.moveColumnTo(colName, beforeCol, dir);
          }
        };
      })
    );
  }

  const hiddenCols = (
    model.getAllColumns()
    .filter(col => !colsSet.has(col))
    .map(col => {
      return {
        name: col,
        cmd: () => {
          model.showColumn(col, true);
        }
      };
    })
  );

  return [
    {
      name: 'Rename',
      cmd: () => {
        const value = model.getAppr().columns[colName]?.label;
        prompt({ title: `Rename column ${colName}`, value })
        .then(label => {
          model.setColumnLabel(colName, label);
        });
      }
    },
    ...hiddenCols.length ? [{
      name: 'Show ...',
      submenu: hiddenCols
    }, {
      name: 'Show all',
      cmd: () => {
        model.showAllColumns();
      }
    }] : [], {
      name: 'Hide',
      cmd: () => {
        model.showColumn(colName, false);
      }
    }, {
      name: 'Move column to',
      submenu: [
        {
          name: 'the beggining',
          cmd: () => model.moveColumnTo2(colName, 'start')
        }, {
          name: 'the end',
          cmd: () => model.moveColumnTo2(colName, 'end')
        }, {
          name: 'before',
          submenu: moveCol('before')
        }, {
          name: 'after',
          submenu: moveCol('after')
        }
      ]
    }
  ];
}
