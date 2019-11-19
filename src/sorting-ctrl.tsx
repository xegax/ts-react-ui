import * as React from 'react';
import { Tag, Tags } from './tags';
import { Popover, Classes, PopoverIcon, Position } from './popover';
import { ListView, Item } from './list-view2';
import { CSSIcon } from './cssicon';

export interface TagExt extends Tag {
  desc: boolean;
}

export interface Props {
  available: Array<string>;
  sorting: Array<TagExt>;
  reverse: boolean;
  onChanged?(sorting: Array<TagExt>): void;
  onApply?(sorting: Array<TagExt>): void;
  onReverse(reverse: boolean): void;
  style?: React.CSSProperties;
}

interface State {
  sorting?: Array<TagExt>;
  tags?: Array<TagExt>;
  changed?: number;
}

const unsortTag: TagExt = {
  value: null,
  render: 'unsort',
  desc: false,
  removeable: false
};

export class SortingCtrl extends React.Component<Props, State> {
  state: State = {
    tags: this.updateTags(this.props.sorting),
    changed: 0,
    sorting: this.props.sorting.map(s => ({...s}))
  };

  private updateTags(sorting: Array<TagExt>) {
    let tags: Array<TagExt> = sorting.map(item => {
      const tag = {
        ...item,
        icon: sorting.length == 1 ? undefined : (
          <CSSIcon
            icon={item.desc ? 'fa fa-sort-amount-desc' : 'fa fa-sort-amount-asc'}
            onClick={e => {
              e.stopPropagation();
              this.changeTag(tag, { desc: !tag.desc });
            }}
          />
        )
      };
      return tag;
    });

    if (!tags.length) {
      tags = [unsortTag];
    }

    return tags;
  }

  componentDidUpdate(p: Props) {
    if (this.props.sorting == p.sorting)
      return;

    this.setState({
      sorting: this.props.sorting.map(s => ({...s})),
      tags: this.updateTags(this.props.sorting),
      changed: 0
    });
  }

  private changeTag(tag: TagExt, newTag: Partial<TagExt>) {
    let sorting: Array<TagExt>;
    if (tag == unsortTag) {
      sorting = [{ desc: true, value: this.props.available[0], ...newTag }];
    } else {
      const st = this.state.sorting.find(s => s.value == tag.value);
      if (st) {
        Object.keys(newTag)
        .map(k => {
          st[k] = newTag[k];
        });
      }
      sorting = this.state.sorting;
    }

    if (this.props.onChanged) {
      this.props.onChanged(sorting);
    } else {
      this.setState({
        sorting,
        tags: this.updateTags(sorting),
        changed: this.state.changed + 1
      });
    }
  }

  private wrapTag = (tag: TagExt, el: JSX.Element) => {
    let values = this.props.available;
    if (tag != unsortTag) {
      let busyCols = new Set(this.state.tags.map(v => v.value));
      values = this.props.available.filter(c => !busyCols.has(c));
      if (values.length == 0)
        return el;
    }

    const valuesArr: Array<Item> = values.map(col => ({
      value: col,
      className: Classes.POPOVER_DISMISS
    }));

    const value = valuesArr.find(v => v.value == tag.value);
    return (
      <Popover>
        {el}
        <ListView
          value={[value]}
          values={valuesArr}
          onSelect={items => {
            this.changeTag(tag, { value: items[0].value });
          }}
        />
      </Popover>
    );
  };

  private onAdd = (value: Array<Item>) => {
    let sorting = [
      ...this.state.sorting,
      {
        value: value[0].value,
        desc: true
      }
    ];

    if (this.props.onChanged) {
      this.props.onChanged(sorting);
    } else {
      this.setState({
        sorting,
        tags: this.updateTags(sorting),
        changed: this.state.changed + 1
      });
    }
  };

  private onRemove = (tag: Tag) => {
    let sorting = Array<TagExt>();
    if (this.state.sorting.length == 1) {
      sorting = [];
    } else {
      sorting = this.state.sorting.filter(col => col.value != tag.value);
    }

    if (this.props.onChanged) {
      this.props.onChanged(sorting);
    } else {
      this.setState({
        sorting,
        tags: this.updateTags(sorting),
        changed: this.state.changed + 1
      });
    }
  };

  private toggleReverse = () => {
    this.props.onReverse(!this.props.reverse);
  };

  private renderApply() {
    if (!this.props.onApply)
      return null;

    const active = this.state.changed != 0;
    return (
      <CSSIcon
        title='Apply'
        disabled={!active}
        icon='fa fa-check-circle'
        style={{ color: active ? 'green' : 'gray' }}
        onClick={() => {
          this.props.onApply(this.state.sorting);
        }}
      />
    );
  }

  private renderNewItems() {
    const busyCols = new Set(this.state.tags.map(t => t.value));
    const strArr = this.props.available.filter(v => !busyCols.has(v));
    if (!this.props.available.length || !strArr.length || this.state.tags[0] == unsortTag)
      return null;

    const values: Array<Item> = strArr.map(value => ({ value, className: Classes.POPOVER_DISMISS }));
    return (
      <PopoverIcon
        title='Append'
        icon='fa fa-plus'
        style={{ color: 'green' }}
        showOnHover
        position={Position.BOTTOM_RIGHT}
      >
        <ListView
          values={values}
          onSelect={this.onAdd}
        />
      </PopoverIcon>
    );
  }

  render() {
    return (
      <div
        className='horz-panel-1'
        style={{ display: 'flex', alignItems: 'center', paddingLeft: 5, paddingRight: 5, ...this.props.style }}
      >
        <CSSIcon
          icon={this.props.reverse ? 'fa fa-arrow-up' : 'fa fa-arrow-down'}
          onClick={this.toggleReverse}
        />
        <div style={{ flexGrow: 1, overflowX: 'hidden' }}>
          <Tags
            noBG
            noBorder
            noWrap
            wrapTag={this.wrapTag}
            onRemove={this.onRemove}
            values={this.state.tags}
          />
        </div>
        {this.renderNewItems()}
        {this.renderApply()}
      </div>
    );
  }
}
