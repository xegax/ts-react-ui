import * as React from 'react';
import { SwitchPropItem, DropDownPropItem2 } from '../prop-sheet';
import { GridViewModel } from './grid-view-model';
import { Tags, Tag } from '../tags';
import { PopoverIcon } from '../popover';
import { renderMenu } from '../menu';
import { prompt } from '../prompt';
import { clone } from '../common/common';
import { GridSortAppr } from './grid-view-appr';
import { Item } from '../list-view-loadable';
import { CSSIcon } from '../cssicon';
import { Subscriber } from '../subscriber';

interface ColTag extends Tag {
  asc: boolean;
}

interface Props {
  model: GridViewModel;
}

interface State {
  schemaIdx?: number;
}

export class GridPanelSort extends React.Component<Props, State> {
  state: State = {};

  render() {
    return (
      <Subscriber
        model={this.props.model}
        render={this.renderPanel}
      />
    );
  }

  private renderCol = (col: { name: string; asc: boolean }) => {
    return (
      <>
        <CSSIcon
          icon={col.asc ? 'fa fa-angle-down' : 'fa fa-angle-up'}
          style={{ marginRight: 5 }}
        />
        {col.name}
      </>
    );
  };

  private renderPanel = () => {
    const m = this.props.model;
    const appr = m.getAppr();
    const schemaArr = appr.sortSchema.map(s => {
      return {
        value: s.name
      };
    });

    const cols: Array<ColTag> = appr.sort.columns.map(c => {
      return {
        asc: c.asc,
        value: c.name,
        render: this.renderCol(c),
        removeable: true
      };
    });

    return (
      <>
        <DropDownPropItem2
          label='Schema'
          values={schemaArr}
          value={schemaArr[this.state.schemaIdx]}
          onSelect={item => {
            const schemaIdx = schemaArr.findIndex(s => s == item);
            const schema = appr.sortSchema[schemaIdx];
            if (schema) {
              m.setApprChange({ sort: schema.schema });
              this.setState({ schemaIdx });
            }
          }}
          renderOptions={item => {
            return (
              <PopoverIcon icon='fa fa-ellipsis-v'>
                {this.renderSchemaOpts(schemaArr, item)}
              </PopoverIcon>
            );
          }}
        />
        <Tags
          onTagClick={tag => {
            const col = appr.sort.columns.find(c => tag.value == c.name);
            if (!col)
              return;

            col.asc = col.asc ? false : true;
            m.setApprChange({ sort: appr.sort });
          }}
          values={cols}
          onRemove={c => {
            m.setApprChange({ sort: { columns: appr.sort.columns.filter(col => col.name != c.value) } });
          }}
          first={
            <PopoverIcon
              disabled={this.getColsToAdd().length == 0}
              icon='fa fa-plus'
              title='Add columns'
              style={{ margin: 3 }}
            >
              {this.renderColsToAdd()}
            </PopoverIcon>
          }
        />
        <SwitchPropItem
          label='Reverse'
          value={appr.sort.reverse}
          onChanged={reverse => {
            m.setApprChange({ sort: { reverse } });
          }}
        />
      </>
    );
  }

  private getColsToAdd() {
    const m = this.props.model;
    const appr = this.props.model.getAppr();
    const curr = new Set(appr.sort.columns.map(c => c.name));
    return m.getAllColumns().filter(c => !curr.has(c));
  }

  private renderSchemaOpts(schemaArr: Array<Item>, item: Item) {
    const m = this.props.model;
    const appr = m.getAppr();

    return renderMenu([
      {
        name: 'New schema',
        cmd: () => {
          prompt({ title: 'Create new schema', value: 'new schema' })
          .then(name => {
            m.setApprChange({
              sortSchema: [
                ...appr.sortSchema,
                {
                  name,
                  schema: clone(appr.sort as GridSortAppr)
                }
              ]
            });
            this.setState({ schemaIdx: appr.sortSchema.length });
          });
        }
      }, {
        name: 'Delete schema',
        disabled: item == null,
        cmd: () => {
          const i = schemaArr.findIndex(s => s == item);
          appr.sortSchema.splice(i, 1);
          m.setApprChange({ sortSchema: appr.sortSchema });
          this.setState({ schemaIdx: -1 });
        }
      }, {
        name: 'Save schema',
        disabled: item == null,
        cmd: () => {
          const i = schemaArr.findIndex(s => s == item);
          appr.sortSchema[i].schema = clone(appr.sort) as GridSortAppr;
          m.setApprChange({ sortSchema: appr.sortSchema });
        }
      }
    ]);
  }

  private renderColsToAdd() {
    const m = this.props.model;
    const appr = m.getAppr();
    return renderMenu(this.getColsToAdd().map(name => {
      return {
        name,
        cmd: () => {
          m.setApprChange({
            sort: { columns: [...appr.sort.columns, { name, asc: false }] }
          });
        }
      };
    }));
  }
}
