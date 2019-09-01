import * as React from 'react';
import { ListViewLoadable, ListViewLoadableModel, Item } from '../list-view-loadable';
import { showModal } from '../show-modal';
import { Dialog, Classes as cs, Button, Tag } from '../blueprint';
import { FitToParent } from '../fittoparent';
import { cn } from '../common/common';
import { RenderType } from '../list-view';
import { CheckBox } from '../checkbox';
import { IconNames } from '@blueprintjs/icons';
import { InputGroup } from '../input-group';
import { CSSIcon } from '../cssicon';

interface ItemExt extends Item {
  origRender: RenderType;
}

export interface SelectCatsRemoteArgs {
  select?: Set<string>;
  totalValues: number;
  filterValues?(filter: string): Promise<{ totalValues: number }>;
  loadValues(from: number, count: number): Promise< Array<Item> >;
  sortValues?(type: 'value' | 'count'): Promise<void>;
}

export interface SelectCatsModalArgs extends SelectCatsRemoteArgs {
  title?: string;
}

interface Props extends SelectCatsRemoteArgs {
  onSelect?(select: Set<string>): void;
  onCancel?(): void;
  select?: Set<string>;
}

interface State {
  filter?: string;
  totalValues?: number;
  reverse?: boolean;
  sort?: 'value' | 'count'; 
}

export class SelectCategory extends React.Component<Props, State> {
  state: State = { sort: 'value' };
  header: ItemExt;
  ref = React.createRef<ListViewLoadable>();
  sort: Promise<void>;

  constructor(props) {
    super(props);

    this.header = {
      value: null,
      origRender: this.renderHeader,
      render: this.renderItem
    };
  }

  componentDidMount() {
    this.setState({ totalValues: this.props.totalValues });
  }

  renderHeader = (item: ItemExt): JSX.Element => {
    let sortIcon = this.state.sort == 'count' ? 'fa fa-sort-amount-asc' : 'fa fa-sort-alpha-asc';
    if (this.sort)
      sortIcon = 'fa fa-spinner fa-spin';
    return (
      <>
        <div className='flexgrow1'>name</div>
        <div className='flexgrow0 horz-panel-1'>
          {this.props.sortValues ?
            <CSSIcon
              showOnHover
              icon={sortIcon}
              onClick={() => {
                if (this.sort)
                  return;

                let sort: 'value' | 'count' = this.state.sort == 'value' ? 'count' : 'value';
                this.sort && this.sort.cancel();
                this.sort = this.props.sortValues(sort)
                .then(() => {
                  this.sort = null;
                  this.ref.current.reload();
                  this.setState({});
                });

                this.setState({ sort });
              }}
            /> : null
          }
          <CSSIcon
            showOnHover
            icon={this.state.reverse ? 'fa fa-arrow-up' : 'fa fa-arrow-down'}
            onClick={() => {
              this.setState({ reverse: !this.state.reverse });
              this.ref.current.toggleReverse();
            }}
          />
        </div>
      </>
    );
  }

  renderFilter() {
    if (!this.props.filterValues)
      return null;

    return (
      <InputGroup
        icon={IconNames.SEARCH}
        right={<Tag minimal>{this.state.totalValues}</Tag>}
        onEnter={filter => {
          this.props.filterValues(filter)
          .then(r => {
            this.setState({ filter, totalValues: r.totalValues })
          });
        }}
      />
    );
  }

  renderItem = (item: ItemExt): JSX.Element => {
    const select = this.props.select;
    const v = typeof item.origRender == 'function' ? item.origRender(item, null) : item.origRender || item.value;
    return (
      <div className={cn(item.className, 'horz-panel-1', 'flexrow')}>
        <CheckBox
          value={select && select.has(item.value) || false}
          onChange={newv => {
            if (!select || item == this.header)
              return;

            if (newv)
              select.add(item.value);
            else
              select.delete(item.value);
            this.setState({});
          }}
        />
        <div className={cn('flexrow', 'flexgrow1')}>
          {v}
        </div>
      </div>
    );
  }
  
  onLoadNext = (from: number, count: number): Promise<Array<Item>> => {
    return (
      this.props.loadValues(from, count)
      .then(values => {
        return values.map(v => {
          return {
            value: v.value,
            render: this.renderItem,
            origRender: v.render,
            title: v.title,
            className: v.className
          } as ItemExt;
        });
      })
    );
  }

  render() {
    const args = this.props;

    return (
      <div className='vert-panel-1 padding' style={{height: 400, display: 'flex', flexDirection: 'column' }}>
        <div>
          {this.renderFilter()}
        </div>
        <FitToParent wrapToFlex>
          <ListViewLoadable
            ref={this.ref}
            header={this.header}
            key={this.state.filter}
            values={null}
            totalValues={() => this.state.totalValues || args.totalValues}
            onLoadNext={this.onLoadNext}
          />
        </FitToParent>
      </div>
    );
  }
}

export function selectCategoryRemote(args: SelectCatsModalArgs): Promise< Set<string> > {
  return new Promise<Set<string>>((resolve, reject) => {
    const select = new Set<string>(args.select);
    const dlg = showModal(
      <Dialog
        title={args.title || 'Select categories'}
        isCloseButtonShown
        isOpen
        onClose={e => {
          if (e.type == 'keydown')
            reject('cancel');
          else
            resolve(select);

          dlg.close();
        }}
      >
        <SelectCategory
          {...args}
          select={select}
          onSelect={select => {
            resolve(select);
            dlg.close();
          }}
        />
        <div className={cn(cs.DIALOG_FOOTER, 'horz-panel-1')} style={{ textAlign: 'center' }}>
          <Button onClick={() => {
            dlg.close();
            resolve(select);
          }}>OK</Button>
          <Button onClick={() => {
            dlg.close();
            reject('cancel');
          }}>Cancel</Button>
        </div>
      </Dialog>
    );
  });
}

export interface SelectCatsArgs {
  title?: string;
  values: Array<Item>;
  select?: Set<string>;
}

export function selectCategory(args: SelectCatsArgs): Promise< Set<string> > {
  let filtered: Array<Item> = null;
  return selectCategoryRemote({
    select: args.select,
    title: args.title,
    loadValues: (from: number, count: number) => {
      return Promise.resolve((filtered || args.values).slice(from, count));
    },
    filterValues: (filter: string) => {
      if (!filter) {
        filtered = null;
      } else {
        filtered = args.values.filter(cat => {
          return cat.value.indexOf(filter) != -1;
        });
      }
      return Promise.resolve({ totalValues: (filtered || args.values).length });
    },
    totalValues: args.values.length
  });
}
