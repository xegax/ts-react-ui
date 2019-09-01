import * as React from 'react';
import { CSSIcon } from './cssicon';
import { cn } from './common/common';

export const classes = {
  tags: 'tags-ctrl',
  tagWrap: 'tag-wrap',
  tag: 'tag',
  label: 'label'
};

export interface Tag {
  value: string;
  tooltip?: string;
  render?: string | JSX.Element | ((tag: Tag) => JSX.Element);
}

export interface Props {
  values: Array<Tag>;
  onClick?(e: React.MouseEvent<HTMLElement>): void;
  onChange?(tags: Array<Tag>): void;
  onRemove?(tag: Tag): void;
}

export class Tags extends React.Component<Props> {
  onRemove(tag: Tag) {
    const i = this.props.values.indexOf(tag);
    if (i == -1)
      return;

    const { onRemove, onChange } = this.props;
    onRemove && onRemove(tag);
    onChange && onChange(this.props.values.filter(t => t != tag));  
  }

  renderTag = (tag: Tag) => {
    const { onChange, onRemove } = this.props;
    let jsx: JSX.Element | string = tag.value;

    if (tag.render)
      jsx = typeof tag.render == 'function' ? tag.render(tag) : tag.render;

    return (
      <div
        className={classes.tagWrap}
        title={tag.tooltip || tag.value}
        key={tag.value}
        onClick={e => {
          e.stopPropagation();
        }}
      >
        <div className={cn(classes.tag, 'horz-panel-1')}>
          <div className={classes.label}>
            {jsx}
          </div>
          {(onChange || onRemove) && (
            <CSSIcon
              title='remove'
              icon='fa fa-close'
              onClick={() => this.onRemove(tag)}
            />
          )}
        </div>
      </div>
    );
  };

  render() {
    return (
      <div className={classes.tags} onClick={this.props.onClick}>
        {this.props.values.map(this.renderTag)}
      </div>
    );
  }
}
