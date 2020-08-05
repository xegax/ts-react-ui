import * as React from 'react';
import { GridViewModel } from './grid-view-model';
import { Grid, CellProps, HeaderProps, CardProps } from './grid';
import { showMenu, IMenuItem, ISubmenuItem } from '../menu';
import { prompt } from '../prompt';
import { getStyleFromAppr } from '../common/font-appr';
import { CSSIcon } from '../cssicon';

export interface RenderIconArgs {
  col: string;
  icon: string;
}

interface Props {
  model?: GridViewModel;
  onColumnCtxMenu?(model: GridViewModel, col: string): Array<ISubmenuItem | IMenuItem>;
  renderIcon?(args: RenderIconArgs): JSX.Element;
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
    const style = getStyleFromAppr({...appr.body.font, ...appr.columns[colName]});
    return (
      <span style={style}>
        {row.cell[p.col]}
      </span>
    );
  }

  private renderCard = (p: CardProps) => {
    const m = this.props.model.getGrid();
    const row = m.getRowOrLoad(p.row);
    if (!row)
      return null;

    const appr = this.props.model.getAppr();
    const cols = this.props.model.getViewColumns();
    p.style = { backgroundColor: appr.cardsView.color };
    return (
      <div className='abs fit-to-abs'>
        {row.cell.map((v, i) => <div key={i}>{cols[i]}: {v}</div>)}
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
          icon={(sortCol.asc && !appr.sort.reverse) ? 'fa fa-angle-down' : 'fa fa-angle-up'}
        />
      );
    }

    return (
      <span
        style={{ ...getStyleFromAppr(appr.header.font), justifyContent: 'center' }}
        className='horz-panel-1 flex'
      >
        {col.icon ? this.renderIcon({ icon: col.icon, col: colName }) : undefined}
        <div style={{ textOverflow: 'ellipsis', overflowX: 'hidden' }}>{col.label || colName}</div>
        {sortIcon}
      </span>
    );
  }

  render() {
    if (!this.props.model.getRequestor())
      return null;

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
