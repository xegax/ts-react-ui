import * as React from 'react';
import {
  PropsGroup
} from '../prop-sheet';
import { Item } from '../drop-down';
import { Publisher } from 'objio';
import { ListView } from '../list-view';
import { Tabs, Tab } from '../tabs';
import { PopoverIcon } from '../popover';
import { Tags } from '../tags';
import { selectCategoryRemote, selectCategory } from './select-category';
import { CheckIcon } from '../checkicon';
import {
  FilterModel,
  FilterEventType,
  ColItem,
  FilterTgt,
  CatFilter,
  TextFilter,
  RangeFilter,
  FilterData,
  FiltersMap,
  getCatFilter,
  getRangeFilter,
  getTextFilter,
  FilterHolder
} from './filter-panel-decl';
import { InputGroup } from '../input-group';
import { IconNames } from '@blueprintjs/icons';
import { RangeSlider } from '../range-slider';
import { FuncRenderer, render } from '../react-common';
import { Menu, MenuItem } from '@blueprintjs/core';
import { clone, clamp } from '../common/common';
import { Textbox } from '../textbox';

const minMaxHolder = [];

interface FilterItem extends Item {
  tgt: FilterTgt;
  filter: FilterData;
}

function isFilterEmpty(f: FilterData) {
  const cat = getCatFilter(f);
  if (cat)
    return !cat.values.length;

  const text = getTextFilter(f);
  if (text)
    return !text.filterText;

  const range = getRangeFilter(f);
  if (range)
    return range.range[0] == null && range.range[1] == null;

  throw 'unknown filter';
}

export class FilterPanel extends Publisher<FilterEventType> implements FilterModel {
  private columns = Array<ColItem>();
  private include = Array<FilterHolder>();
  private exclude = Array<FilterHolder>();

  constructor(cols: Array<ColItem>) {
    super();

    this.columns = cols;
  }

  createColFilter(colName: string): FilterData | undefined {
    const col = this.columns.find(c => c.name == colName);
    if (!col)
      return;

    if (col.type.startsWith('varchar'))
      return { values: [] } as CatFilter;

    if (col.type == 'text')
      return { filterText: '' } as TextFilter;

    if (col.type == 'integer' || col.type == 'real') {
      let r: RangeFilter = { range: [] };
      return r;
    }
  }

  getOrderedFilters(tgt: FilterTgt): Array<FilterHolder> {
    const arr = tgt == 'include' ? this.include : this.exclude;
    return arr.sort((a, b) => {
      if (a.order != null && b.order != null)
        return a.order - b.order;

      if (a.order != null)
        return -1;

      if (b.order != null)
        return 1;

      return 0;
    });
  }

  getFiltersArr(tgt: FilterTgt, filter?: FilterData): Array<FilterHolder> {
    const arr = this.getOrderedFilters(tgt);
    if (!filter)
      return arr.filter(h => h.order != null);

    const h = arr.find(f => f.filter == filter);
    if (!h)
      throw 'filter not found';

    if (h.order == null)
      return arr.filter(cf => cf.order != null);

    return arr.filter(cf => cf.order != null && cf.order < h.order);
  }

  getFilters(): FiltersMap {
    let map: FiltersMap = {
      include: [],
      exclude: []
    };

    [
      { src: this.include, dst: map.include },
      { src: this.exclude, dst: map.exclude }
    ].forEach(obj => {
      for (let n = 0; n < obj.src.length; n++) {
        const data = obj.src[n];
        let dst = obj.dst.find(item => item.column == data.column.name);
        if (!dst)
          obj.dst.push(dst = { column: data.column.name, data: [] });

        if (getCatFilter(data.filter))
          dst.data.push({ values: [] });
        else if (getRangeFilter(data.filter))
          dst.data.push({ range: [] });
        else if (getTextFilter(data.filter))
          dst.data.push({ filterText: '' });
      }
      obj.dst.sort((a, b) => a.column.localeCompare(b.column));
    });

    return map;
  }

  setColumns(cols: Array<ColItem>) {
    this.columns = cols;
    this.delayedNotify();
  }

  setFilters(f: FiltersMap): void {
    this.include = [];
    this.exclude = [];

    f.include.forEach(item => {
      const column = this.columns.find(cn => cn.name == item.column);
      if (!column)
        return;

      item.data.forEach(filter => {
        this.include.push({ column, filter });
      });
    });

    f.exclude.forEach(item => {
      const column = this.columns.find(cn => cn.name == item.column);
      if (!column)
        return;

      item.data.forEach(filter => {
        this.exclude.push({ column, filter });
      });
    });
  }

  getColumns(filter?: Array<string>): Array<ColItem> {
    if (!filter)
      return this.columns;

    const f = new Set(filter);
    return this.columns.filter(c => f.has(c.name));
  }

  getColumn(col: string): ColItem | undefined {
    return this.columns.find(c => c.name == col);
  }

  private getFilter(tgt: FilterTgt, column: string): Array<FilterData> | undefined {
    const arr = tgt == 'include' ? this.include : this.exclude;
    return arr.filter(i => i.column.name == column).map(i => i.filter);
  }

  getCatValues(tgt: FilterTgt, col: string): CatFilter | undefined {
    const f = this.getFilter(tgt, col);
    return f ? getCatFilter(f[0]) : undefined;
  }

  updateCatValues(args: { col: string, tgt: FilterTgt, values: Set<string> }) {
    const c = this.getCatValues(args.tgt, args.col);

    let added = 0;
    let removed = 0;

    let vals = new Set(c.values);
    for (let value of args.values) {
      if (vals.has(value))
        continue;

      c.values.push(value);
      added++;
    }

    for (let n = c.values.length - 1; n >= 0; n--) {
      const value = c.values[n];
      if (args.values.has(value))
        continue;

      c.values.splice(c.values.indexOf(value), 1);
      removed++;
    }

    if (!added && !removed)
      return;

    this.onFilterModified(args.tgt, c);
  }

  removeCatValue(args: { col: string, value: string, tgt: FilterTgt }) {
    const c = this.getCatValues(args.tgt, args.col);
    const i = c.values.indexOf(args.value);
    if (i == -1)
      return;
    
    c.values.splice(i, 1);
    this.onFilterModified(args.tgt, c);
  }

  appendFilters(tgt: FilterTgt, newFilters: Array<{col: string, filter: FilterData}>) {
    const filters = tgt == 'include' ? this.include : this.exclude;

    for (let f of newFilters) {
      const column = this.columns.find(c => c.name == f.col);
      if (!column)
        continue;

      if (filters.some(cf => cf.filter == f.filter))
        continue;

      if (filters.some(cf => cf.column.name == f.col && !!getCatFilter(cf.filter) && !!getCatFilter(f.filter)))
        continue;

      filters.push({ column, filter: f.filter });
    }

    this.delayedNotify({ type: 'change-filter-columns' });
  }

  deleteFilter(tgt: FilterTgt, f: FilterData) {
    const arr = tgt == 'include' ? this.include : this.exclude;
    const i = arr.findIndex(fd => fd.filter == f);
    if (i != -1) {
      arr.splice(i, 1);
      this.delayedNotify({ type: 'change-filter-columns' });
    }
  }

  duplicateFilter(tgt: FilterTgt, f: FilterData) {
    let newf: FilterData;
    if (getCatFilter(f))
      newf = { ...f, values: [] } as CatFilter;
    else if (getTextFilter(f))
      newf = { ...f, filterText: '' } as TextFilter;
    else if (getRangeFilter(f))
      newf = { range: [] } as RangeFilter;

    if (!newf)
      return;

    const arr = tgt == 'include' ? this.include : this.exclude;
    const i = arr.findIndex(cf => cf.filter == f);
    if (i == -1)
      return;

    arr.splice(i, 1, arr[i], { column: arr[i].column, filter: newf });
    this.delayedNotify();
  }

  onFilterModified(tgt: FilterTgt, f: FilterData) {
    const arr = tgt == 'include' ? this.include : this.exclude;
    const h = arr.find(h => h.filter == f);
    if (!h)
      return console.error('filter not found');
    
    const empty = isFilterEmpty(f);
    if (h.order == null && !empty) {
      let maxOrder = 0;
      for (let _f of arr) {
        if (_f.order == null && _f != h) {
          this.resetFilter(_f);
          continue;
        }

        if (_f.order != null)
          maxOrder = Math.max(_f.order, maxOrder);
      }
      h.order = maxOrder + 1;
    } else {  // filter reset
      for (let fh of arr) {
        if (fh.order == null || fh.order > h.order)
          this.resetFilter(fh);
      }

      let cat = getCatFilter(h.filter);
      let range = getRangeFilter(h.filter);
      let text = getTextFilter(h.filter);
      if (cat && !cat.values.length)
        delete h.order;
      else if (range && range.range[0] == null && range.range[1] == null)
        delete h.order;
      else if (text && !text.filterText)
        delete h.order;
    }

    this.delayedNotify({ type: 'change-filter-values' });
  }

  private resetFilter(h: FilterHolder) {
    delete h.order;

    let cat = getCatFilter(h.filter);
    let range = getRangeFilter(h.filter);
    let text = getTextFilter(h.filter);
    if (cat)
      cat.values = [];
    else if (range) {
      range.range = [];
      range.minMax = range.rangeFull = undefined;
    } else if (text) {
      text.filterText = '';
    }
  }

  changeFilterTo<T extends FilterData>(tgt: FilterTgt, f: FilterData, to: T) {
    for (let k of Object.keys(f))
      delete f[k];

    for (let k of Object.keys(to))
      f[k] = to[k];

    this.onFilterModified(tgt, f);
  }
}

export interface Props {
  model?: FilterPanel;
  defaultWidth?: number;
}

export class FilterPanelView extends React.Component<Props> {
  componentDidMount() {
    this.props.model.subscribe(this.subscriber);
  }

  componentWillUnmount() {
    this.props.model.unsubscribe(this.subscriber);
  }

  subscriber = () => {
    this.setState({});
  };

  selectValues(tgt: FilterTgt, col: string, f: CatFilter) {
    const m = this.props.model;
    const c = m.getColumn(col);
    const select = new Set(f.values);

    const filters = m.getFiltersArr(tgt, f);
    let filterText: string;
    selectCategoryRemote({
      sort: f.sort,
      sortReverse: f.sortReverse,
      title: `Select values from "${col}"`,
      totalValues: c.getValues({ from: 0, count: 50, filters }).then(r => r.total),
      select,
      sortValues: sort => {
        f.sort = sort;
        return c.setSort(sort);
      },
      onToggleReverse: reverse => {
        f.sortReverse = reverse;
      },
      filterValues: (f: string) => {
        filterText = f;
        return c.setFilter({ filter: f, filters }).then(r => ({ totalValues: r.total }))
      },
      loadValues: (from, count) => {
        let farr = filters.slice();
        if (filterText)
          farr = [...filters, { column: c, filter: { filterText } }];

        return (
          c.getValues({ from, count, filters: farr })
            .then(arr => {
              return arr.values.map(v => {
                return {
                  value: v.value,
                  render: (
                    <>
                      <div className='flexgrow1' style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {v.value}
                      </div>
                      {v.count != null && <div className='flexgrow0' style={{ color: 'silver' }}>
                        {v.count}
                      </div>}
                    </>
                  )
                };
              });
            })
        );
      }
    }).then(values => {
      m.updateCatValues({ col, tgt, values });
    });
  }

  renderCol(col: string): React.ReactNode {
    const c = this.props.model.getColumns().find(c => c.name == col);
    if (!c || !c.label)
      return col;

    return render(c.label);
  }

  renderTextFilter(tgt: FilterTgt, col: string, f: TextFilter) {
    const m = this.props.model;
    const c = m.getColumn(col);
    return (
      <div className='horz-panel-1'>
        <div className='horz-panel-1' style={{ display: 'flex' }}>
        <PopoverIcon icon='fa fa-square-o'>
            <Menu>
              <MenuItem
                text='Duplicate'
                onClick={() => m.duplicateFilter(tgt, f)}
              />
              <FuncRenderer
                f={() => this.renderChangeMenu(tgt, c, f)}
              />
              <MenuItem
                text='Delete filter'
                onClick={() => m.deleteFilter(tgt, f)}
              />
            </Menu>
          </PopoverIcon>
          <div style={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {this.renderCol(col)}
          </div>
        </div>
        <div className='flexrow'>
          <InputGroup
            icon={IconNames.SEARCH}
            className='flexgrow1 inputborder'
            value={f.filterText}
            onEnter={text => {
              f.filterText = text;
              m.onFilterModified(tgt, f);
            }}
          />
        </div>
      </div>
    );
  }

  renderRangeFilter(tgt: FilterTgt, col: string, f: RangeFilter) {
    const m = this.props.model;
    const c = m.getColumn(col);
    let minMax = f.minMax || [0, 100];
    let range = [...f.range];
    if (!f.minMax && c.getNumRange) {
      f.minMax = minMaxHolder;
      c.getNumRange({ filters: m.getFiltersArr(tgt, f) })
      .then(res => {
        f.minMax = res.minMax;
        f.rangeFull = f.minMax.slice();
        this.setState({});
      });
    }

    if (range[0] == null)
      range[0] = minMax[0];
    if (range[1] == null)
      range[1] = minMax[1];

    const enabled = f.minMax != null && f.minMax != minMaxHolder && minMax[0] != minMax[1];
    return (
      <div className='horz-panel-1'>
        <div className='horz-panel-1' style={{ display: 'flex' }}>
        <PopoverIcon icon='fa fa-square-o'>
            <Menu>
              <MenuItem
                text='Duplicate'
                onClick={() => m.duplicateFilter(tgt, f)}
              />
              <FuncRenderer f={() => this.renderChangeMenu(tgt, c, f)}/>
              <MenuItem
                text='Delete filter'
                onClick={() => this.props.model.deleteFilter(tgt, f)}
              />
            </Menu>
          </PopoverIcon>
          <div style={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {this.renderCol(col)}
          </div>
        </div>
        <div className='flexrow horz-panel-1' style={{ height: 15 }}>
          <Textbox
            disabled={!enabled}
            fitToFlex
            style={{ flexGrow: 1, textAlign: 'center', fontSize: '70%', border: '1px solid lightgray' }}
            value={'' + (f.minMax && f.rangeFull ? f.rangeFull[0] : '')}
            onEnter={v => {
              let newv = +v;
              if (Number.isNaN(newv))
                return;

              newv = clamp(newv, f.minMax);
              f.rangeFull[0] = newv;

              if (newv == f.minMax[0])
                newv = undefined;

              if (newv == f.range[0])
                return;

              f.range[0] = newv;
              m.onFilterModified(tgt, f);
            }}
          />
          <span>-</span>
          <Textbox
            disabled={!enabled}
            fitToFlex
            style={{ flexGrow: 1, textAlign: 'center', fontSize: '70%', border: '1px solid lightgray' }}
            value={'' + (f.minMax && f.rangeFull ? f.rangeFull[1] : '')}
            onEnter={v => {
              let newv = +v;
              if (Number.isNaN(newv))
                return;

              newv = clamp(newv, f.minMax);
              f.rangeFull[1] = newv;

              if (newv == f.minMax[1])
                newv = undefined;

              if (newv == f.range[1])
                return;

              f.range[1] = newv;
              m.onFilterModified(tgt, f);
            }}
          />
        </div>
        <div className='flexrow horz-panel-1' style={{ height: 15 }}>
          <RangeSlider
            precision={c.type == 'integer' ? 0 : 2}
            enabled={enabled}
            wrapToFlex
            range={range}
            min={minMax[0]}
            max={minMax[1]}
            onChanging={(min, max) => {
              f.rangeFull[0] = min;
              f.rangeFull[1] = max;
              this.setState({});
            }}
            onChanged={(min, max) => {
              f.rangeFull = [min, max];
              if (min == f.minMax[0])
                min = undefined;

              if (max == f.minMax[1])
                max = undefined;

              f.range = [min, max];
              m.onFilterModified(tgt, f);
              this.setState({ range: undefined });
            }}
          />
        </div>
      </div>
    );
  }

  renderChangeMenu(tgt: FilterTgt, c: ColItem, f: FilterData) {
    let cat: JSX.Element;
    
    if (!getCatFilter(f)) {
      cat = (
        <MenuItem
          text='Category filter'
          onClick={() => {
            this.props.model.changeFilterTo(tgt, f, { values: [] as Array<string> });
            this.props.model.delayedNotify({ type: 'change-filter-columns' });
          }}
        />
      );
    }

    let text: JSX.Element;
    if ((c.type == 'text' || c.type == 'varchar') && !getTextFilter(f)) {
      text = (
        <MenuItem
          text='Text filter'
          onClick={() => {
            this.props.model.changeFilterTo(tgt, f, { filterText: '' });
            this.props.model.delayedNotify({ type: 'change-filter-columns' });
          }}
        />
      );
    }

    let range: JSX.Element;
    if ((c.type == 'integer' || c.type == 'real') && !getRangeFilter(f)) {
      range = (
        <MenuItem
          text='Range filter'
          onClick={() => {
            this.props.model.changeFilterTo(tgt, f, { range: [] });
            this.props.model.delayedNotify({ type: 'change-filter-columns' });
          }}
        />
      );
    }

    return (
      <MenuItem text='Change to'>
        {cat}
        {text}
        {range}
      </MenuItem>
    );
  }

  renderCatFilter(tgt: FilterTgt, col: string, f: CatFilter) {
    const m = this.props.model;
    const c = m.getColumn(col);
    return (
      <div className='horz-panel-1'>
        <div className='horz-panel-1' style={{ display: 'flex' }}>
          <PopoverIcon icon='fa fa-square-o'>
              <Menu>
                <MenuItem
                  text='Select'
                  disabled={!c || !c.getValues}
                  onClick={() => this.selectValues(tgt, col, f)}
                />
                <MenuItem
                  text='Clear selection'
                  onClick={() => {
                    m.updateCatValues({ col, tgt, values: new Set() });
                  }}
                />
                <FuncRenderer f={() => this.renderChangeMenu(tgt, c, f)}/>
                <MenuItem
                  text='Delete filter'
                  onClick={() => m.deleteFilter(tgt, f)}
                />
              </Menu>
          </PopoverIcon>
          <div style={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {this.renderCol(col)}
          </div>
        </div>
        <Tags
          onClick={!c || !c.getValues ? undefined : () => this.selectValues(tgt, col, f)}
          values={Array.from(f.values).map(c => ({ value: c }))}
          onRemove={tag => {
            this.props.model.removeCatValue({
              tgt,
              col,
              value: tag.value
            });
          }}
        />
      </div>
    );
  }

  renderColumnFilter = (item: FilterItem) => {
    const column = item.value;

    const cat = getCatFilter(item.filter);
    if (cat)
      return this.renderCatFilter(item.tgt, column, cat);

    const tf = getTextFilter(item.filter);
    if (tf)
      return this.renderTextFilter(item.tgt, column, tf);

    const range = getRangeFilter(item.filter);
    if (range)
      return this.renderRangeFilter(item.tgt, column, range);

    return <>invalid filter</>;
  }

  renderFilterItem = (item: Item) => {
    return {
      value: item.value
    };
  }

  renderFiltersCfgButton(tgt: FilterTgt) {
    const name = tgt == 'include' ? 'Include' : 'Exclude';
    const m = this.props.model;
    const values = m.getColumns().map(col => {
      return {
        value: col.name,
        render: col.label
      };
    });

    return (
      <span className='horz-panel-1'>
        <CheckIcon
          faIcon='fa fa-filter'
          title={`Configure ${tgt} filter`}
          value
          showOnHover
          onClick={() => {
            selectCategory({ values, title: `Append filters for ${tgt}` })
            .then(columns => {
              const newFilters = Array.from(columns).map(col => ({ col, filter: m.createColFilter(col) }));
              m.appendFilters(tgt, newFilters);
            });
          }}
        />
        <span>{name}</span>
      </span>
    );
  }

  renderFilters(tgt: FilterTgt) {
    const m = this.props.model;
    const filtersArr = Array<FilterItem>();
    for (const f of m.getOrderedFilters(tgt)) {
      filtersArr.push({
        value: f.column.name,
        filter: f.filter,
        tgt,
        render: this.renderColumnFilter
      });
    }

    return (
      <Tab
        id={tgt}
        label={this.renderFiltersCfgButton(tgt)}
      >
        <ListView
          className='vert-panel-1'
          itemPadding={false}
          border={false}
          highlight={false}
          values={filtersArr}
        />
      </Tab>
    );
  }

  renderFilterContent() {
    const m = this.props.model;
    return (
      <Tabs defaultSelect='include'>
        {this.renderFilters('include')}
        {this.renderFilters('exclude')}
      </Tabs>
    );
  }

  render() {
    return (
      <PropsGroup label='Filter' padding={false}>
        {this.renderFilterContent()}
      </PropsGroup>
    );
  }
}