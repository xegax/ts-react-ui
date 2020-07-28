import * as React from 'react';
import { GridViewModel } from './grid-view-model';
import { Grid, CellProps, HeaderProps } from './grid';
import { showMenu, IMenuItem, ISubmenuItem } from '../menu';
import { prompt } from '../prompt';
import { getStyleFromAppr } from '../common/font-appr';

interface Props {
  model?: GridViewModel;
  onColumnCtxMenu?(model: GridViewModel, col: string): Array<ISubmenuItem | IMenuItem>;
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
    return (
      <span style={getStyleFromAppr(appr.header.font)}>
        {appr.columns[colName]?.label || colName}
      </span>
    );
  }

  render() {
    if (!this.props.model.getRequestor())
      return null;

    const appr = this.props.model.getAppr();
    const m = this.props.model.getGrid();
    return (
      <Grid
        headerBorder={appr.header.border}
        bodyBorder={appr.body.border}
        model={m}
        renderCell={this.renderCell}
        renderHeader={this.renderHeader}
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
