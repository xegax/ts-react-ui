import * as React from 'react';
import { className as cn } from './common/common';
import { Scrollbar } from './scrollbar';
import { KeyCode } from './common/keycode';
import { RenderListModel, ListColumn } from './model/list';
import './_list.scss';

export {
  RenderListModel
}

const classes = {
  list: 'list-ctrl',
  border: 'list-ctrl-border',
  content: 'list-ctrl-content',
  column: 'list-ctrl-column',
  row: 'list-ctrl-row',
  header: 'list-ctrl-header',
  selRow: 'list-ctrl-selrow',
  cell: 'list-ctrl-cell'
};

export interface Props extends React.HTMLProps<any> {
  width?: number;
  height?: number;
  model: RenderListModel;
  border?: boolean;
  className?: string;
  extraClass?: string;
}

export interface State {
  model?: RenderListModel;
}

export interface RenderRow {
  column?: ListColumn;
  jsx?: JSX.Element;
  rowIdxAbs: number;
  rowIdxRel: number;
  colIdx: number;
  data: JSX.Element | Object| string;
}

export class List extends React.Component<Props, State> {
  private ctrl: React.RefObject<HTMLDivElement> = React.createRef();

  constructor(props: Props) {
    super(props);

    this.state = {
      model: props.model
    };
  }

  subscriber = () => {
    this.setState({});
  };

  componentDidMount() {
    this.state.model.subscribe(this.subscriber);
    this.state.model.setHeight(this.props.height);
  }

  componentWillUnmount() {
    this.state.model.unsubscribe(this.subscriber);
  }

  renderHeader(col: ListColumn): JSX.Element {
    const model = this.state.model;
    const height = model.getHeaderSize();
    let row: JSX.Element | string = col.name;
    if (col.renderHeader)
      row = col.renderHeader(row, col);
    
    row = (
      <div className={classes.cell}>
        {row}
      </div>
    );

    row = (
      <div
        className={classes.header}
        key={'hdr-' + col.name}
        style={{height, lineHeight: height + 'px'}}>
          {row}
      </div>
    );

    return row;
  }

  renderRow(args: RenderRow): JSX.Element {
    const model = this.state.model;
    const height = model.getItemHeight();
    let row: JSX.Element | Object | string = args.data || '...';
    
    if (args.column && args.data && args.column.render)
      row = args.column.render({
        item: args.data,
        column: args.column,
        rowIdx: args.rowIdxAbs,
        colIdx: args.colIdx
      });

    if (args.column && args.column.width != -1)
      row = (
        <div className={classes.cell}>
          {row}
        </div>
      );

    const className = cn(classes.row, model.isSelect(args.rowIdxAbs) && classes.selRow);
    return (
      <div
        onMouseUp={event => {
          model.setSelRow(args.rowIdxAbs, event.ctrlKey, event.shiftKey);
        }}
        className={className}
        key={args.rowIdxRel}
        style={{height}}>
          {row}
      </div>
    );
  }

  renderRows(): JSX.Element {
    const model = this.state.model;
    let arr = Array<Object>();
    if (model.getItemsCount() > 0)
      arr = model.getItems(model.getSelectFirst(), model.getVisibleCount());
    const columns = model.getColumns();

    let cols = Array<JSX.Element>();
    for (let c = 0; c < Math.max(1, columns.length); c++) {
      const column: ListColumn = columns[c];

      let rows = Array<JSX.Element>();
      if (column && model.getHeaderSize()) {
        rows.push(this.renderHeader(column));
      }

      for (let n = 0; n < model.getVisibleCount(); n++) {
        let data = arr ? arr[n] : null;

        rows.push(this.renderRow({
          column,
          data,
          colIdx: c,
          rowIdxRel: n,
          rowIdxAbs: n + model.getSelectFirst()
        }));
      }

      let colStyle: React.CSSProperties = {};

      if (column && column.width) {
        if (column.width != -1)
          colStyle.width = column.width;
        colStyle.flexGrow = 0;
      }

      cols.push(
        <div
          className={classes.column}
          key={'col-' + c}
          style={colStyle}
        >
          {rows}
        </div>
      );
    }

    return (
      <div className={classes.content}>
        {cols}
      </div>
    );
  }

  componentWillReceiveProps(props: Props) {
    if (props.height != this.state.model.getHeight())
      this.state.model.setHeight(props.height);

    if (props.width != this.state.model.getWidth())
      this.state.model.setWidth(props.width);
  }

  onKeyDown = (event: React.KeyboardEvent<any>) => {
    if (this.ctrl.current != document.activeElement)
      return;

    const model = this.props.model;
    event.preventDefault();
    event.stopPropagation();

    let selRow = model.getSelRow();
    let selFirst = model.getSelectFirst();

    let dir = 0;
    if (event.keyCode == KeyCode.ARROW_UP) {
      dir = -1;
    } else if (event.keyCode == KeyCode.ARROW_DOWN) {
      dir = 1;
    }

    if (dir) {
      if (model.getSelType() == 'none')
        model.setSelectFirst(selFirst + dir);
      else
        model.setSelRow(selRow + dir);
    }

    if (event.keyCode == KeyCode.PAGE_UP) {
      selFirst -= model.getFullVisibleCount();
      model.setSelectFirst(selFirst);
      model.setSelRow(selFirst);
    } else if (event.keyCode == KeyCode.PAGE_DOWN) {
      selFirst += model.getFullVisibleCount();
      model.setSelectFirst(selFirst);
      model.setSelRow(selFirst);
    }

    this.props.onKeyDown && this.props.onKeyDown(event);
  }

  onWheel = (event: React.WheelEvent<any>) => {
    event.preventDefault();
    event.stopPropagation();
  
    let first = this.props.model.getSelectFirst();
    if (event.deltaY < 0)
      first -= 1;
    else
      first += 1;

    this.props.model.setSelectFirst(first);
  }

  render() {
    const { width, height, model } = this.props;
    const className = cn(
      this.props.className || classes.list,
      this.props.extraClass,
      this.props.border && classes.border
    );
    return (
      <div
        ref={this.ctrl}
        tabIndex={1}
        className={className}
        style={{width, height}}
        onKeyDown={this.onKeyDown}
        onWheel={this.onWheel}
      >
        {this.renderRows()}
        <Scrollbar
          itemsCount = {model.getItemsCount()}
          itemHeight = {model.getItemHeight()}
          itemsHeight = {height - model.getHeaderSize()}
          height = {height}
          firstItem = {model.getSelectFirst()}
          setSelectFirst = {first => model.setSelectFirst(first)}
        />
      </div>
    );
  }
}