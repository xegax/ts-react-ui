import * as React from 'react';
import { CSSIcon } from './cssicon';
import { cn } from './common/common';

export const css = {
  tags: 'tags-ctrl',
  background: 'tags-ctrl-bg',
  border: 'tags-ctrl-border',
  noWrap: 'tags-ctrl-nowrap',
  tagWrap: 'tag-wrap',
  tag: 'tag',
  label: 'label'
};

export interface Tag {
  value: string;
  tooltip?: string;
  icon?: JSX.Element;
  render?: string | JSX.Element | ((tag: Tag) => React.ReactChild);
  removeable?: boolean;
}

export interface Props {
  noBG?: boolean;
  noBorder?: boolean;
  noWrap?: boolean;
  values: Array<Tag>;
  onClick?(e: React.MouseEvent<HTMLElement>): void;
  onChange?(tags: Array<Tag>): void;
  onRemove?(tag: Tag): void;
  wrapTag?(tag: Tag, tagEl: JSX.Element): React.ReactChild;
  first?: React.ReactChild;
}

export class Tags extends React.Component<Props> {
  wrapTag(tag: Tag, tagEl: JSX.Element) {
    if (this.props.wrapTag)
      return this.props.wrapTag(tag, tagEl);

    return tagEl;
  }

  onRemove(tag: Tag) {
    const i = this.props.values.indexOf(tag);
    if (i == -1)
      return;

    const { onRemove, onChange } = this.props;
    onRemove && onRemove(tag);
    onChange && onChange(this.props.values.filter(t => t != tag));  
  }

  renderTagImpl = (tag: Tag) => {
    const { onChange, onRemove } = this.props;
    let jsx: React.ReactChild = tag.value;

    if (tag.render)
      jsx = typeof tag.render == 'function' ? tag.render(tag) : tag.render;

    return this.wrapTag(tag,
      <div
        className={css.tagWrap}
        title={tag.tooltip || tag.value}
        key={tag.value}
        onClick={e => {
          //e.stopPropagation();
        }}
      >
        <div className={cn(css.tag, 'horz-panel-1')}>
          {tag.icon}
          <div className={css.label}>
            {jsx}
          </div>
          {(onChange || onRemove) && tag.removeable !== false && (
            <CSSIcon
              showOnHover
              title='Remove'
              icon='fa fa-close'
              onClick={e => {
                e.stopPropagation();
                this.onRemove(tag);
              }}
            />
          )}
        </div>
      </div>
    );
  };

  render() {
    const classes = cn(
      css.tags,
      !this.props.noBG && css.background,
      !this.props.noBorder && css.border,
      this.props.noWrap && css.noWrap
    );

    return (
      <div className={classes} onClick={this.props.onClick}>
        {this.props.first}
        {this.props.values.map(this.renderTagImpl)}
      </div>
    );
  }
}
