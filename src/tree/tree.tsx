import * as React from 'react';
import { ListView, Item } from '../list-view';
import { render } from '../react-common';
import { CSSIcon } from '../cssicon';
import { TreeItem, TreeItemHolder, TreeModel, getPath } from './tree-model';
import { FitToParent } from '../fittoparent';
import * as folderSVG from '../icons/svg/folder.svg';
import { IconSVG, IconSize } from '../icon-svg';

export {  TreeItem };

interface Props {
  values: Array<TreeItem>;
  select?: Array<string>;
  defaultSelect?: Array<string>;
  onSelect?(path: Array<TreeItem>): void;
  hideIcons?: boolean;
  defaultIcon?: JSX.Element;
  defaultIconSize?: IconSize;
  style?: React.CSSProperties;
}

interface State {
  model: TreeModel;
}

export class Tree extends React.Component<Props, State> {
  static defaultProps: Partial<Props> = {};

  constructor(props: Props) {
    super(props);

    const model = new TreeModel({
      renderTreeItem: this.renderTreeItem
    });
    this.state = { model };

    model.setValues(props.values, props.defaultSelect);
  }

  subscriber = () => {
    this.setState({});
  };

  componentDidMount() {
    this.state.model.subscribe(this.subscriber);
  }

  componentWillUnmount() {
    this.state.model.unsubscribe(this.subscriber);
  }

  static getDerivedStateFromProps(p: Props, s: State) {
    s.model.setValues(p.values, p.select);
  }

  renderTreeItem = (holder: TreeItemHolder) => {
    const m = this.state.model;
    const folder = m.isFolder(holder);
    const defultIcon = this.props.defaultIcon || (
      <IconSVG
        icon={folderSVG}
        size={this.props.defaultIconSize}
      />
    );
    return (
      <div className='horz-panel-1' style={{ marginLeft: holder.level * 5, display: 'inline-flex', alignItems: 'center' }}>
        <CSSIcon
          width='1em'
          hidden={!folder}
          icon={m.isOpened(holder) ? 'fa fa-angle-down' : 'fa fa-angle-right'}
          onClick={e => {
            e.stopPropagation();
            m.isOpened(holder) ? m.close(holder) : m.open(holder);
          }}
        />
        {!this.props.hideIcons && ( holder.item.icon || defultIcon)}
        <span>
          {render(holder.item.render, holder.item) || holder.item.value}
        </span>
      </div>
    );
  }
  
  render() {
    const sel = this.props.select || this.props.defaultSelect || [];
    return (
      <div style={{ position: 'relative', overflow: 'hidden', ...this.props.style }}>
        <div style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
          <FitToParent>
            <ListView
              border={false}
              defaultValue={sel ? { value: sel.join('/') } : undefined}
              values={this.state.model.getHolders()}
              onSelect={(holder: TreeItemHolder) => {
                let path = Array<TreeItem>();

                while(holder) {
                  path.push(holder.item);
                  holder = holder.parent;
                }

                this.props.onSelect && this.props.onSelect(path.reverse());
              }}
            />
          </FitToParent>
        </div>
      </div>
    );
  }
}
