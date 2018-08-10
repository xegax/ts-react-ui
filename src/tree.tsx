import * as React from 'react';
import { List } from './list';
import { TreeModel, TreeItem } from './model/tree';
import { className as cn } from './common/common';
import './_tree.scss';

export {
  TreeModel,
  TreeItem
};

const classes = {
  open: 'fa fa-minus-square-o',
  close: 'fa fa-plus-square-o',
  tree: 'tree-ctrl',
  item: 'tree-ctrl-item',
  opened: 'tree-ctrl-opened',
  closed: 'tree-ctrl-closed',
  imgIcon: 'tree-ctrl-imgicon',
  emptyIcon: 'tree-ctrl-emptyicon'
};

export interface Props {
  model: TreeModel;
  width?: number;
  height?: number;
  renderItem?: (item: TreeItem, jsx: JSX.Element) => JSX.Element;
}

function EmptyWraper<T>(data: T) {
  return data;
}

export class Tree extends React.Component<Props, {}> {
  renderItem = (item: TreeItem): JSX.Element => {
    const model = this.props.model;
    const levelOffs = 10;
    const className = cn(
      classes.item,
      model.isOpenable(item) ? item.open && classes.opened || classes.closed : false
    );

    let icon: JSX.Element;
    if (model.isOpenable(item))
      icon = <i className={cn(item.open && classes.open || classes.close)}/>;
    else if (item.faIcon)
      icon = <i className={`fa fa-${item.faIcon}`}/>;
    else if (item.imgIcon)
      icon = <div className={classes.imgIcon} style={{ backgroundImage: `url(${item.imgIcon})`}}/>;
    else
      icon = <div className={classes.emptyIcon}/>;

    const itemWrap = item.itemWrap || EmptyWraper;
    let element = itemWrap(<div>{icon}{item.label}</div>);
    if (this.props.renderItem)
      element = this.props.renderItem(item, element);

    return (
      <div
        className={className}
        style={{ marginLeft: item.ctrlData.level * levelOffs, cursor: item.children ? 'pointer' : 'default' }}
        onClick={() => {
          if (!item.children)
            return;

          item.open = !item.open;
          model.rebuildTree();
          model.getRender().clearCache(true);
          model.getRender().notify();
        }}
      >
        {element}
      </div>
    );
  }

  componentWillMount() {
    this.props.model.setHandler({
      renderItem: this.renderItem
    });
  }

  render() {
    return (
      <List
        extraClass={classes.tree}
        width={this.props.width}
        height={this.props.height}
        border={false}
        model={this.props.model.getRender()}
      />
    );
  }
}
