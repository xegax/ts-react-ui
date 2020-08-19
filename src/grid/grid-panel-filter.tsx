import * as React from 'react';
import { Subscriber } from '../subscriber';
import { GridViewModel, ColType } from './grid-view-model';
import { FilterPanel, FilterPanelView } from '../panel/filter-panel';
import { DBColType } from '../common/db';
import { ColItem, GetValuesArgs, Value, getCatFilter } from '../panel/filter-panel-decl';
import { SortType, FilterHolder } from '../../panel/filter-panel-decl';
import { ViewArgs, FilterArgs } from './grid-requestor-decl';

interface Props {
  model: GridViewModel;
}

interface State {
  model?: FilterPanel;
}

function converType(type: ColType): DBColType {
  if (type == 'string')
    return 'varchar';

  if (type == 'numeric')
    return 'real';

  return type;
}

function convertFilters(filters: Array<FilterHolder>): FilterArgs | undefined {
  const filter: FilterArgs = {
    children: [],
    op: 'or'
  };

  filters = filters.slice().sort((a, b) => a.order - b.order);
  filters.forEach(f => {
    const cat = getCatFilter(f.filter);
    if (cat)
      filter.children.push(...cat.values.map(value => ({ column: f.column.name, value })));
  });

  if (!filter.children.length)
    return undefined;

  return filter;
}

export class GridPanelFilter extends React.Component<Props, State> {
  state: State = {
    model: new FilterPanel([])
  };

  constructor(props: Props) {
    super(props);

    props.model.subscribe(this.updateColumns, 'columns');
    this.state.model.subscribe(this.updateFilter, 'change-filter-values');
  }

  private updateColumns = () => {
    this.state.model.setColumns(
      this.props.model.getAllColumns().map(this.makeColItem)
    );
  }

  private updateFilter = () => {
    this.props.model.setFilters( convertFilters(this.state.model.getFiltersArr('include')) );
  };

  private makeColItem = (name: string): ColItem => {
    let sort: SortType | undefined;
    return {
      name,
      type: converType(this.props.model.getColType(name)),
      getValues: (args: GetValuesArgs) => this.collectValues(name, args, sort),
      setSort: s => {
        sort = s;
        return Promise.resolve();
      }
    };
  }

  private collectValues = async (column: string, args: GetValuesArgs, sort?: SortType): Promise<{ total: number; values: Array<Value> }> => {
    const req = this.props.model.getRequestor();

    console.log(sort);
    const viewArgs: ViewArgs = {
      distinct: { column }
    };
    if (sort == 'count')
      viewArgs.sorting = { cols: [{ name: 'count', asc: true }] };
    else if (sort == 'value')
      viewArgs.sorting = { cols: [{ name: 'value', asc: true }] };

    const view = await req.createView(viewArgs);
    const res = await req.getRows({ viewId: view.viewId, from: args.from, count: args.count });

    return Promise.resolve({
      total: view.desc.rows,
      values: res.rows.map(row => {
        return {
          value: '' + row[0],
          count: +row[1]
        };
      })
    });
  };

  private renderPanel = () => {
    return (
      <FilterPanelView
        model={this.state.model}
      />
    );
  };

  render() {
    return (
      <Subscriber
        model={this.props.model}
        render={this.renderPanel}
      />
    );
  }
}
