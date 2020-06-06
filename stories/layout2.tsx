import * as React from 'react';
import { storiesOf } from '@storybook/react';
import { FlexResizer } from '../src/resizer';
// import { Layout } from '../src/layout';
import { Publisher } from 'objio/common/publisher';
import {
  Layout,
  LayoutSchema,
  Draggable,
  SchemaItem,
  isSchemaElement,
  findItemByKey as findSchemaItemByKey,
  SchemaContainer,
  SchemaSize
} from '../src/layout/index';
import { Tree, TreeItem } from '../src/tree/tree';
import { findItem, getPath } from '../src/tree/item-helpers';
import { ItemPath } from '../src/tree/tree-model';
import { PropSheet, PropsGroup, SwitchPropItem, TextPropItem } from '../src/prop-sheet';
import { IconMap } from '../src/common/icons';
import { CSSIcon } from '../src/cssicon';
import { PopoverIcon, Position } from '../src/popover';
import { renderMenu, IMenuItem, ISubmenuItem } from '../src/menu';

interface SchemaTreeItem extends TreeItem {
}


interface MakeSchemaArgs {
  c: SchemaItem;
  key?: string;
  p?: SchemaTreeItem;
  pc?: SchemaContainer;
  isOpen: Set<string>;
  menu?(item: SchemaItem, p?: SchemaContainer): Array<IMenuItem | ISubmenuItem>;
}

function schemaContToTree(args: MakeSchemaArgs): SchemaTreeItem {
  const key = args.key || args.key;
  const { el, cont } = isSchemaElement(args.c);
  let name = el ? `element ${el.key}` : cont.type;

  const menu = args.menu ? args.menu(args.c, args.pc) : undefined;
  const treeItem: SchemaTreeItem = {
    icon: (
      IconMap.render(el ? 'empty' : cont.type == 'column' ? 'columns' : 'rows', { displayFlex: false, style: { height: '1.2em' } })
    ),
    open: args.isOpen.has(key),
    value: key,
    render: name,
    parent: args.p,
    rightIcons: menu && menu.length ? (
      <PopoverIcon
        icon='fa fa-ellipsis-v'
        position={Position.BOTTOM_LEFT}
      >
        {renderMenu(menu)}
      </PopoverIcon>
    ) : undefined,
    title: `${name} (${key})`
  };

  treeItem.children = cont ? (
    cont.items.map((child, i) => (
      schemaContToTree({
        c: child,
        key: child.key,
        p: treeItem,
        pc: cont,
        menu: args.menu,
        isOpen: args.isOpen
      })
    ))
  ) : []
  return treeItem;
}

interface Props {
  model: ContentModel;
}

interface State {
  width: number;
  height: number;
}

class PropsPanel extends React.Component<Props, State> {
  state: State = { width: 200, height: 300 };

  private subscriber = () => {
    this.setState({});
  };

  componentDidMount() {
    this.props.model.subscribe(this.subscriber);
  }

  componentWillUnmount() {
    this.props.model.unsubscribe(this.subscriber);
  }

  private onResize = (width: number) => {
    this.setState({ width });
  };

  private onPropsResize = (height: number) => {
    this.setState({ height });
  };

  private onSelectTreeItem = (items: ItemPath[]) => {
    if (!items.length)
      return;

    const first = items[0];
    this.props.model.setSelTreeItem(first[first.length - 1] as SchemaTreeItem);
  };

  render() {
    const m = this.props.model;
    const item = m.getSelSchemaItem() || {} as SchemaItem;
    const cont = m.getSelItemCont() || { type: '' };

    return (
      <>
        <div
          className='flexcol'
          style={{
            width: this.state.width,
            background: 'white',
            flexGrow: 0
          }}
        >
          <Draggable
            handle={m.getLayoutRef().current}
          >
            <div
              style={{
                flexGrow: 0,
                padding: 5,
                marginBottom: 5,
                backgroundColor: '#d0d0d0',
                textAlign: 'center',
                borderBottom: '1px solid silver',
                cursor: 'default',
                userSelect: 'none'
              }}
            >
              drag
            </div>
          </Draggable>
          <Tree
            values={m.getTreeItems()}
            style={{ flexGrow: 0, height: this.state.height }}
            onSelect={this.onSelectTreeItem}
            select={m.getSelPath()}
            onOpen={m.onOpen}
            onClose={m.onClose}
          />
          <FlexResizer
            tgtSize={this.state.height}
            onResizing={this.onPropsResize}
          />
          <div style={{ flexGrow: 1, backgroundColor: 'white', position: 'relative' }}>
            <PropSheet fitToAbs>
              <PropsGroup label='Props'>
                <TextPropItem
                  show={cont.type == 'column'}
                  label='Height'
                  value={item.height != null ? '' + item.height : ''}
                  onEnterNum={height => {
                    item.height = height;
                    m.updateSchemaItem(item);
                  }}
                  icon={
                    <CSSIcon
                      icon='fa fa-lock'
                      displayFlex={false}
                      checked={item.height != null}
                      style={{ paddingLeft: 5 }}
                      onClick={() => {
                        m.toggleAttribute(item, 'height');
                      }}
                    />
                  }
                />
                <TextPropItem
                  show={cont.type == 'row'}
                  label='Width'
                  value={item.width != null ? '' + item.width : ''}
                  onEnterNum={width => {
                    item.width = width;
                    m.updateSchemaItem(item);
                  }}
                  icon={
                    <CSSIcon
                      icon='fa fa-lock'
                      displayFlex={false}
                      checked={item.width != null}
                      style={{ paddingLeft: 5 }}
                      onClick={() => {
                        m.toggleAttribute(item, 'width');
                      }}
                    />
                  }
                />
                <TextPropItem
                  show={cont.type == 'column'}
                  label='Min height'
                  value={item.minHeight != null ? '' + item.minHeight : ''}
                  onEnterNum={min => {
                    item.minHeight = min;
                    m.updateSchemaItem(item);
                  }}
                  icon={
                    <CSSIcon
                      icon='fa fa-lock'
                      displayFlex={false}
                      style={{ paddingLeft: 5 }}
                      checked={item.minHeight != null}
                      onClick={() => {
                        m.toggleAttribute(item, 'minHeight');
                      }}
                    />
                  }
                />
                <TextPropItem
                  show={cont.type == 'column'}
                  label='Max height'
                  value={item.maxHeight != null ? '' + item.maxHeight : ''}
                  onEnterNum={max => {
                    item.maxHeight = max;
                    m.updateSchemaItem(item);
                  }}
                  icon={
                    <CSSIcon
                      icon='fa fa-lock'
                      displayFlex={false}
                      style={{ paddingLeft: 5 }}
                      checked={item.maxHeight != null}
                      onClick={() => {
                        m.toggleAttribute(item, 'maxHeight');
                      }}
                    />
                  }
                />
              </PropsGroup>
            </PropSheet>
          </div>
        </div>
        <FlexResizer
          vertical
          min={100}
          max={300}
          tgtSize={this.state.width}
          onResizing={this.onResize}
        />
      </>
    );
  }
}

class ContentModel extends Publisher {
  private layoutRef = React.createRef<Layout>();
  private schema: LayoutSchema = {
    root: {
      type: 'column',
      grow: 1,
      items: []
    }
  };
  private treeItems = Array<TreeItem>();

  private width: number = 500;
  private height: number = 400;
  private schemaTreeItem?: SchemaTreeItem;
  
  private schemaItem?: SchemaItem;
  private schemaItemCont?: SchemaContainer;

  private selPath?: string[][];
  private openItems = new Set<string>();

  onOpen = (item: TreeItem) => {
    this.openItems.add(item.value);
  }

  onClose = (item: TreeItem) => {
    this.openItems.delete(item.value);
  }

  toggleAttribute(item: SchemaItem, attr: keyof SchemaSize) {
    const layout = this.layoutRef.current;
    const el = layout.getDOMElement(item.key);
    if (!el)
      return;

    const rect = el.getBoundingClientRect();
    const vert = new Set(['height', 'minHeight', 'maxHeight']);
    const rm = item[attr] != null;
    if (vert.has(attr)) {
      layout.updateItem(item.key, {[attr]: rm ? undefined : rect.height});
    } else {
      layout.updateItem(item.key, {[attr]: rm ? undefined : rect.width});
    }

    this.updateSchemaItem(item);
  }

  getLayoutRef() {
    return this.layoutRef;
  }

  getSchema() {
    return this.schema;
  }

  updateSchemaItem(item: SchemaItem) {
    this.schema = {...this.schema};
    this.delayedNotify();
  }

  private getMenuItems = (item: SchemaItem, p: SchemaContainer): Array<IMenuItem | ISubmenuItem> => {
    const items: Array<IMenuItem | ISubmenuItem> = [];
    items.push({
      name: 'Delete',
      cmd: () => {
        this.layoutRef.current.remove(item.key);
      }
    });
  
    return items;
  }

  setSchema(schema: LayoutSchema, updateTree?: boolean) {
    this.schema = schema;

    if (updateTree) {
      this.treeItems = [
        schemaContToTree({
          c: this.schema.root,
          menu: this.getMenuItems,
          isOpen: this.openItems
        })
      ];
    }

    if (this.schemaTreeItem) {
      const res = findSchemaItemByKey(this.schema.root, this.schemaTreeItem.value);
      if (res) {
        this.schemaItem = res.item;
        this.schemaItemCont = res.cont;
      }
    }

    this.delayedNotify();
  }

  setSelTreeItem(item: SchemaTreeItem | undefined) {
    if (item == this.schemaTreeItem)
      return;

    this.schemaTreeItem = item;
    if (item) {
      const res = findSchemaItemByKey(this.schema.root, item.value);
      if (res) {
        this.schemaItem = res.item;
        this.schemaItemCont = res.cont;
      }
    } else {
      this.schemaItem = undefined;
      this.schemaItemCont = undefined;
    }

    this.selPath = [ getPath(item).map(leaf => leaf.value) ];
    this.delayedNotify();
  }

  setSelSchemaItem(item: SchemaItem) {
    const selTreeItem = findItem(leaf => {
      return leaf.value == item.key;
    }, this.treeItems) as SchemaTreeItem;
    this.setSelTreeItem(selTreeItem);
  }

  getSelSchemaItem() {
    return this.schemaItem;
  }

  getSelItemCont() {
    return this.schemaItemCont;
  }

  isSchemaSelected(item: SchemaItem) {
    if (!this.schemaItem)
      return false;

    return this.schemaItem.key == item.key;
  }

  getTreeItems(): Array<TreeItem> {
    return this.treeItems;
  }

  getWidth() {
    return this.width;
  }

  getHeight() {
    return this.height;
  }

  getSelPath() {
    return this.selPath;
  }
}

class ContentPanel extends React.Component<{ model: ContentModel }> {
  private subscriber = () => {
    this.setState({});
  }

  componentDidMount() {
    this.props.model.subscribe(this.subscriber);
  }

  componentWillUnmount() {
    this.props.model.unsubscribe(this.subscriber);
  }

  private wrapper = (item: SchemaItem, jsx: JSX.Element) => {
    const m = this.props.model;
    const sel = m.isSchemaSelected(item);
    return (
      React.cloneElement(jsx, {
        style: {
          ...jsx.props.style,
          backgroundColor: sel ? 'rgba(200,200,200,0.5)' : undefined
        },
        onMouseDown: (e: React.MouseEvent) => {
          e.stopPropagation();
          m.setSelSchemaItem(item);
        }
      })
    );
  }

  render() {
    const m = this.props.model;
    return (
      <div
        className='flexgrow1'
        style={{ position: 'relative' }}
      >
        <div
          className='abs-fit'
          style={{
            overflow: 'auto',
            backgroundColor: 'gray',
            display: 'flex',
            paddingLeft: 5,
            paddingTop: 5
          }}
        >
          <div
            style={{
              position: 'relative',
              width: m.getWidth(),
              height: m.getHeight()
            }}
          >
            <Layout
              ref={m.getLayoutRef()}
              className='abs-fit'
              style={{
                width: m.getWidth(),
                height: m.getHeight(),
                backgroundColor: 'white'
              }}
              schema={m.getSchema()}
              onChanged={schema => {
                m.setSchema({ ...schema }, true);
              }}
              onKeysChanged={schema => {
                m.setSchema({...schema}, true);
              }}
              wrapper={this.wrapper}
            >
            </Layout>
          </div>
        </div>
      </div>
    );
  }
}

let model = new ContentModel();


storiesOf('Layout', module)
  .add('layout 2', () => {
    return (
      <div className='abs-fit flexrow'>
        <PropsPanel
          model={model}
        />
        <ContentPanel
          model={model}
        />
      </div>
    );
  });