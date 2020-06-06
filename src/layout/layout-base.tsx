import * as React from 'react';
import {
  LayoutSchema,
  SchemaContainer,
  SchemaElement,
  SchemaItem,
  ContainerType,
  isSchemaElement,
  findItem,
  findItemByKey
} from './layout-schema';
import { clone, cn, clamp } from '../common/common';
import { LayoutElement, Props as ElementProps } from './layout-element';
import { FlexResizer } from '../resizer';

const css = {
  layout: 'lw',
  element: 'lw-el',
  column: 'lw-column',
  row: 'lw-row'
};

interface Props {
  schema: LayoutSchema;

  style?: React.CSSProperties;

  className?: string;
  children?: React.ReactNode;
  onChanged?(newSchema: LayoutSchema): void;
  onKeysChanged?(newSchema: LayoutSchema): void;
  wrapper?(item: SchemaItem, jsx: JSX.Element): JSX.Element;
  splitSize?: number;
}

export interface KeyToItem {
  jsx?: React.ReactElement<ElementProps>;
  item?: SchemaItem;
  cont?: SchemaContainer;
  ref?: React.RefObject<HTMLDivElement>;
}

interface ItemSize {
  curr: number;
  min: number;
  fixed: number;
}

export interface Resizer {
  getGrow(item: SchemaItem, newSize?: number): number;
  getFullSize(): number;
  getSize(elIdx: number): ItemSize;
  // getMin(elIdx: number): number;
  getMinSizeRange(item1: SchemaItem, item2: SchemaItem): number[];
}

interface State {
  schema?: LayoutSchema;
  propsSchema?: LayoutSchema;
  keyToItem?: {[key: string]: KeyToItem};
}

export class LayoutBase extends React.Component<Props, State> {
  static defaultProps: Partial<Props> = {
    splitSize: 10
  };

  private ref = React.createRef<HTMLDivElement>();
  state: State = {
    keyToItem: {}
  };

  getElement() {
    return this.ref.current;
  }

  static getDerivedStateFromProps(p: Props, s: State): undefined | State {
    if (p.schema == s.propsSchema)
      return null;

    const keyToItem: {[key: string]: KeyToItem} = {};
    React.Children.forEach(p.children, ((child: React.ReactElement<ElementProps>) => {
      if (!React.isValidElement(child) || child.type != LayoutElement)
        return;

      if (child.key in keyToItem)
        throw new Error('Scheme has elements with duplicate keys');

      keyToItem[child.key] = { jsx: child };
    }));

    const schema = clone(p.schema);
    
    let keyCounter = 0;
    // fill itemsMap and generate keys for keyless containers
    findItem(schema.root, (item, c) => {
      const { el, cont } = isSchemaElement(item);
      let key: string;
      if (el) {
        key = el.key;
      } else if (cont) {
        while (cont.key == null || keyToItem[cont.key]) {
          cont.key = 'ckey-' + (++keyCounter);
        }
        key = cont.key;
      }
      keyToItem[key] = {...keyToItem[key], item, cont: c};
      return false;
    });

    if (keyCounter != 0 && p.onKeysChanged)
      p.onKeysChanged(clone(schema));

    return {
      schema,
      propsSchema: p.schema,
      keyToItem
    };
  }

  findItemByKey(key: string) {
    return findItemByKey(this.state.schema.root, key);
  }

  getDOMElement(key: string): HTMLDivElement | undefined {
    return (this.state.keyToItem[key] || { ref: { current: undefined } }).ref.current;
  }

  getItemByKey(key: string) {
    return this.state.keyToItem[key];
  }

  onChanged() {
    this.props.onChanged && this.props.onChanged(this.state.schema);
  }

  private renderElement = (cont: SchemaContainer, el: SchemaElement) => {
    const tmp = this.state.keyToItem[el.key];
    if (!tmp)
      return;

    const ref = tmp.ref || (tmp.ref = React.createRef());
    return (
      <div
        ref={ref}
        key={el.key}
        className={css.element}
        style={{
          flexGrow: this.getGrow(cont, el),
          width: el.width,
          height: el.height,
          
          minWidth: el.minWidth,
          minHeight: el.minHeight,

          maxWidth: el.maxWidth,
          maxHeight: el.maxHeight
        }}
      >
        <div className={cn(el.grow != 0 && 'abs-fit', 'border', 'flex', 'h-center', 'v-center')}>
          {tmp.jsx || <div>{el.key}</div>}
        </div>
      </div>
    );
  }

  private getItemMinSize(item: SchemaItem, type?: ContainerType) {
    const { cont, el } = isSchemaElement(item);
    if (el) {
      const tmp = this.state.keyToItem[item.key];
      const domEl = tmp.ref.current;
      if (this.getGrow(tmp.cont, item) == 0)
        return 0;

      return type == 'row' ? domEl.offsetWidth : domEl.offsetHeight;
    }

    type = type || cont.type;
    let size = 0;
    for (let next of cont.items) {
      const sz = this.getItemMinSize(next, type);
      if (type != cont.type) {
        size = Math.min(size || sz, sz);
      } else {
        size += sz;
      }
    }

    return size;
  }

  private findItemFixedSize(item: SchemaItem, type?: ContainerType) {
    const { cont, el } = isSchemaElement(item);
    if (el) {
      const tmp = this.state.keyToItem[item.key];
      if (this.getGrow(tmp.cont, item) == 0)
        return (type == 'row' ? item.width : item.height) || 0;

      return 0;
    }

    type = type || cont.type;
    let size = 0;
    for (let next of cont.items) {
      const sz = this.findItemFixedSize(next, type);
      if (type == cont.type)
        size += sz;
      else
        size = Math.max(sz, size);
    }
    if (type == cont.type && cont.items.length > 1)
      size += Math.max(0, cont.items.length - 1) * this.props.splitSize;

    return size;
  }

  getSize(c: SchemaContainer, itemIdx: number): number {
    const tmp = this.state.keyToItem[c.items[itemIdx].key];
    if (!tmp || !tmp.ref || !tmp.ref.current)
      return 0;

    return c.type == 'row' ? tmp.ref.current.offsetWidth : tmp.ref.current.offsetHeight;
  }

  private getMaxSize(type: ContainerType, c: SchemaItem) {
    const { el, cont } = isSchemaElement(c);
    if (el)
      return 10000;

    if (type == 'column' && cont.maxHeight != null)
      return cont.maxHeight;

    if (type == 'row' && cont.maxWidth != null)
      return cont.maxWidth;

    return 10000;
  }

  private getMinSize(c: SchemaContainer, child: number) {
    const { el, cont } = isSchemaElement(c.items[child]);

    if (el)
      return 0;

    if (c.type == 'column' && cont.minHeight != null)
      return cont.minHeight;

    if (c.type == 'row' && cont.minWidth != null)
      return cont.minWidth;

    return 0;
  }

  getResizer(cont: SchemaContainer): Resizer {
    const fullSize = this.getItemMinSize(cont);
    const growable = cont.items.length;
    const sizes = Array<{ curr: number; min: number; fixed: number }>();

    const getSize = (idx: number) => {
      if (!sizes[idx]) {
        sizes[idx] = {
          curr: this.getSize(cont, idx),
          min: this.getMinSize(cont, idx),
          fixed: this.findItemFixedSize(cont.items[idx], cont.type)
        };
      }

      return sizes[idx];
    };

    return {
      getGrow: (item: SchemaItem, newSize?: number) => {
        const idx = cont.items.findIndex(ci => ci == item);
        if (idx == -1)
          throw new Error('Element not found');

        const size = getSize(idx);
        newSize = (newSize != null ? newSize : (size.curr - size.min)) - size.fixed;
        return clamp(newSize * growable / fullSize, [0.0001, growable]);
      },
      getSize: (elIdx: number) => {
        return getSize(elIdx);
      },
      getFullSize: () => fullSize,
      getMinSizeRange: (first: SchemaElement, next: SchemaElement) => {
        const idx1 = cont.items.findIndex(ci => ci == first);
        if (idx1 == -1)
          throw new Error('Element not found');

        const idx2 = cont.items.findIndex(ci => ci == next);
        if (idx2 == -1)
          throw new Error('Element not found');

        const size1 = getSize(idx1);
        const size2 = getSize(idx2);
        const minSize1 = Math.min(size1.curr, this.getMaxSize(cont.type, next) - size2.curr);
        const minSize2 = Math.min(size2.curr, this.getMaxSize(cont.type, first) - size1.curr);
        return [ minSize1, minSize2 ];
      }
    };
  }

  private renderSpliter(c: SchemaContainer, firstIdx: number) {
    const first = c.items[firstIdx];
    const next = c.items[firstIdx + 1];
    if (!next)
      return null;

    if (this.getGrow(c, first) == 0 || this.getGrow(c, next) == 0)
      return (
        <FlexResizer
          vertical={c.type == 'row'}
          key={'split-' + firstIdx}
          tgtSize={0}
          size={this.props.splitSize}
        />
      );

    let size = Array<ItemSize>(), min = Array<number>();
    let resizer: Resizer | undefined;
    const onResizing = (delta: number) => {
      if (!resizer) {
        resizer = this.getResizer(c);
        size = [
          resizer.getSize(firstIdx),
          resizer.getSize(firstIdx + 1)
        ];
        min = [
          -(size[0].curr - size[0].fixed),
          size[1].curr - size[1].fixed
        ];
      }
      delta = clamp(delta, min);
      first.grow = resizer.getGrow(first, size[0].curr + delta);
      next.grow = resizer.getGrow(next, size[1].curr - delta);
      this.setState({});
    };

    const onResized = () => {
      resizer = undefined;
      this.props.onChanged && this.props.onChanged(this.state.schema);
    };

    return (
      <FlexResizer
        vertical={c.type == 'row'}
        key={'split-' + firstIdx}
        tgtSize={0}
        size={this.props.splitSize}
        onResizing={onResizing}
        onResized={onResized}
      />
    );
  }

  private wrapper(c: SchemaItem, jsx: JSX.Element): JSX.Element {
    if (!jsx)
      return undefined;

    if (!this.props.wrapper)
      return jsx;

    return this.props.wrapper(c, jsx);
  }

  getGrow(p: SchemaContainer | undefined, c: SchemaItem) {
    if (!p)
      return c.grow;

    if (p.type == 'column' && c.height != null)
      return 0;

    if (p.type == 'row' && c.width != null)
      return 0;

    return c.grow;
  }

  private renderContainer = (p: SchemaContainer | undefined, c: SchemaContainer) => {
    if (!c)
      return undefined;

    const tmp = this.state.keyToItem[c.key];
    if (!tmp)
      return undefined;

    const ref = tmp.ref || (tmp.ref = React.createRef());

    let items = Array<JSX.Element>();
    for (let n = 0; n < c.items.length; n++) {
      items.push(this.renderItem(c, c.items[n]));
      items.push(this.renderSpliter(c, n));
    }

    return (
      <div
        ref={ref}
        key={c.key}
        className={c.type == 'column' ? css.column : css.row}
        style={{
          flexGrow: this.getGrow(p, c),
          width: c.width,
          height: c.height,
          
          minWidth: c.minWidth,
          minHeight: c.minHeight,

          maxWidth: c.maxWidth,
          maxHeight: c.maxHeight
        }}
      >
        {items}
      </div>
    );
  }

  private renderItem = (p: SchemaContainer, c: SchemaItem) => {
    const { el, cont } = isSchemaElement(c);
    if (el)
      return this.wrapper(el, this.renderElement(p, el));

    return this.wrapper(cont, this.renderContainer(p, cont));
  }

  render() {
    const schema = this.state.schema;
    return (
      <div
        ref={this.ref}
        className={cn(css.layout, this.props.className)}
        style={this.props.style}
      >
        {schema ? this.renderItem(undefined, schema.root) : undefined}
      </div>
    );
  }
}
