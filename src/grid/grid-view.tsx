import * as React from 'react';
import { GridViewModel } from './grid-view-model';
import { Grid, CellProps, HeaderProps } from './grid';
import { showMenu } from '../menu';

interface Props {
  model?: GridViewModel;
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

    return (
      <span>{row.cell[p.col]}</span>
    );
  }

  private renderHeader = (header: HeaderProps) => {
    const cols = this.props.model.getViewColumns();
    const colName = cols[header.col];

    header.wrapperProps.onClick = () => {
      this.props.model.toggleSorting(colName);
    };
    header.wrapperProps.onContextMenu = evt => {
      evt.preventDefault();
      evt.stopPropagation();

      showMenu({ left: evt.pageX, top: evt.pageY }, [
        {
          name: 'Show all',
          cmd: () => {
            this.props.model.showAllColumns();
          }
        }, {
          name: 'Hide',
          cmd: () => {
            this.props.model.hideColumn(colName);
          }
        }
      ]);
    };

    return (
      <span>
        {colName}
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
        onScrollToBottom={() => {
          m.loadNext();
        }}
      />
    );
  }
}
