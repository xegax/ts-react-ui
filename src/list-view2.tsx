import * as React from 'react';
import { cn, clamp } from './common/common';
import { KeyCode } from './common/keycode';
import { Publisher } from 'objio/common/publisher';
import { startDragging } from './common/start-dragging';
import { findParentByFunc } from './common/dom';
import { Timer } from 'objio/common/timer';
import { FitToParent } from './fittoparent';
import { ElementType } from './react-common';

const DEFAULT_CARD_WIDTH = 200;
const DEFAULT_CARD_HEIGHT = 300;

const classes = {
  border: 'border',
  cardItem: 'list-item-card',
  cards: 'cards',
  class: 'list-view-ctrl',
  dropInto: 'drop-into',
  focus: 'focus',
  header: 'list-header',
  headerWrap: 'list-header-wrap',
  highlight: 'list-view-highlight',
  item: 'list-item',
  listWrapper: 'list-wrapper',
  noItemPadding: 'no-item-padding',
  select: 'select'
};

export type RenderType = string | ElementType<Item>;
export interface Item {
  value: string;
  title?: string;
  render?: RenderType;
  className?: string;
}

interface DragAndDropArgs {
  drag: Array<Item>;
  drop: Item;
}

interface MoveToArgs {
  drag: Array<Item>;
  before?: Item;
  after?: Item;
  newArr: Array<Item>;
}

export interface ListProps {
  values: Array<Item>;
  header?: Item;
  value?: Array<Item>;
  defaultValue?: Item;
  border?: boolean;
  highlight?: boolean;
  style?: React.CSSProperties;
  multiselect?: boolean;  // default false

  className?: string;
  cards?: boolean;        // render items as cards
  cardWidth?: number;
  cardHeight?: number;

  itemsPerPage?: number;
  itemClassName?: string;
  itemPadding?: boolean;

  width?: number;
  height?: number;
  maxHeight?: number;
  model?: ListViewModel;

  tabIndex?: number;

  onSelect?(item: Array<Item>): void;
  onKeyDown?(args: { focusItem: Item, event: React.KeyboardEvent }): void;
  onItemSize?(size: number): void;
  onScroll?(event: React.UIEvent): void;

  onDragAndDropTo?(args: DragAndDropArgs): void;
  onMoveTo?(args: MoveToArgs): void;

  noDataToDisplay?: JSX.Element;
  ref?: React.RefObject<any>;
}

interface State {
  itemSize?: number;
  scrollTop?: number;
  model?: ListViewModel;
  drag?: Item;
  drop?: Item;
  vertScrollSize?: number;
}

export class ListViewModel extends Publisher {
  protected values = Array<Item>();
  protected focus: number;
  protected select = Array<Item>();

  getFocus(): number {
    return this.focus;
  }

  setFocus(focus: number): boolean {
    if (this.focus == focus)
      return false;

    this.focus = focus;
    this.delayedNotify({});
    return true;
  }

  setValues(values: Array<Item>, force?: boolean) {
    values = values || [];
    if (force != true && this.values == values)
      return false;

    this.values = values;
    this.focus = null;
    this.delayedNotify({ type: 'values' });
    return true;
  }

  getValues() {
    return this.values;
  }

  setSelect(value: Array<Item>, notify?: boolean) {
    if (this.select == value)
      return;

    value = value || [];
    this.select = value;
    this.focus = this.values.indexOf(value[value.length - 1]);

    if (notify == false)
      return;

    this.delayedNotify({ type: 'select' });
  }

  setValueByIndex(idx: number, notify?: boolean): boolean {
    if (!this.values[idx])
      return false;

    const select = this.values[idx];
    if (this.select.length == 1 && this.select[0] == select)
      return false;

    this.select = [ select ];
    this.focus = idx;

    if (notify == false)
      return false;

    this.delayedNotify({ type: 'select' });
    return true;
  }

  getSelect(): Array<Item> {
    return this.select;
  }
}

export interface IListView {
  onKeyDown(e: React.KeyboardEvent);
  scrollToSelect();
}

export class ListView extends React.Component<ListProps, State> implements IListView {
  state: Readonly<Partial<State>> = {};
  ref = React.createRef<HTMLDivElement>();

  constructor(props: ListProps) {
    super(props);

    const model = props.model || new ListViewModel();
    model.setValues(props.values);
    this.state = { model };
  }

  static getDerivedStateFromProps(props: ListProps, state: State) {
    state.model.setValues(props.values);

    if (props.value != null)
      state.model.setSelect(props.value);

    return null;
  }

  subscriber = () => {
    this.setState({});
  }

  componentDidMount() {
    this.updateFirstItemSize();

    this.state.model.subscribe(this.subscriber);
    this.setState({});
  }

  componentWillUnmount() {
    this.state.model.unsubscribe(this.subscriber);
  }

  getLabel(item: Item): string {
    if (typeof item.render == 'string')
      return item.render;
    return item.value;
  }

  scrollToSelect() {
    const m = this.state.model;
    const sel = m.getSelect();
    if (!sel.length)
      return false;

    const idx = m.getValues().indexOf(sel[sel.length - 1]);
    if (!idx)
      return false;

    this.scrollToIndex(idx);
  }

  scrollToFocus() {
    this.scrollToIndex(this.state.model.getFocus());
  }

  scrollToIndex(index: number) {
    const ctrl = this.ref.current;
    const el = ctrl.childNodes.item(index) as HTMLElement;
    const first = ctrl.firstChild as HTMLElement;
    if (!el)
      return;

    const firstPos = first.getBoundingClientRect();
    const elPos = el.getBoundingClientRect();
    const bbox = ctrl.getBoundingClientRect();

    const offsetTop = elPos.top - bbox.top;
    const pos = Math.round(elPos.top - firstPos.top);
    if (offsetTop < 0) {
      ctrl.scrollTop = pos;
    } else if (offsetTop + el.offsetHeight >= bbox.height) {
      ctrl.scrollTop = Math.round(pos + el.offsetHeight - bbox.height + 2);
    }
  }

  getMaxHeight(): number {
    if (this.state.itemSize && this.props.itemsPerPage)
      return this.props.itemsPerPage * this.state.itemSize;

    return null;
  }

  updateFirstItemSize() {
    let itemSize = 0;
    if (!this.ref.current || !this.ref.current.children || this.ref.current.children.length == 0)
      return;

    const list = this.ref.current;

    itemSize = (list.childNodes.item(0) as HTMLElement).getBoundingClientRect().height;
    if (itemSize == 0)
      return setTimeout(() => this.updateFirstItemSize(), 5);

    if (itemSize == this.state.itemSize)
      return;

    if ( this.props.onItemSize && !this.state.itemSize )
      this.props.onItemSize(itemSize);

    this.setState({ itemSize });
    this.updateSelection( itemSize );
  }

  updateSelection(itemSize?: number) {
    itemSize = itemSize || this.state.itemSize;
    if (!itemSize)
      return false;

    const value = this.state.model.getSelect();
    if (!value.length)
      return false;

    const idx = this.state.model.getValues().indexOf(value[ value.length - 1 ]);
    if (idx == -1)
      return false;
    
    this.ref.current.scrollTop = idx * this.state.itemSize;
    return true;
  }

  findFirstVisibleIndex(): number {
    let parent = this.ref.current;
    let bb = parent.getBoundingClientRect();
    for (let n = 0; n < parent.children.length; n++) {
      const node = parent.children.item(n) as HTMLElement;
      const nodeBB = node.getBoundingClientRect();
      if (bb.top - nodeBB.top <= 0)
        return n;
    }

    return -1;
  }

  onKeyDown = (e: React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();

    let focus = this.state.model.getFocus();

    const focusItem = this.state.model.getValues()[focus];
    if (this.props.onKeyDown)
      this.props.onKeyDown({ focusItem, event: e });

    if (e.keyCode == KeyCode.ENTER && this.state.model.setValueByIndex(focus)) {
      return this.props.onSelect && this.props.onSelect(this.state.model.getSelect());
    } else if (e.keyCode == KeyCode.ESCAPE) {
      return this.props.onSelect && this.props.onSelect([]);
    }

    let vect = 0;
    if (e.keyCode == KeyCode.ARROW_UP)
      vect = -1;
    else if (e.keyCode == KeyCode.ARROW_DOWN)
      vect = 1;

    if (!vect)
      return;

    if (focus == null) {
      focus = this.findFirstVisibleIndex();
      vect = 0;
    }

    const values = this.state.model.getValues();
    focus = clamp(focus + vect, [0, values.length - 1]);
    if (focus == this.state.model.getFocus())
      return;

    this.state.model.setFocus(focus);
    this.scrollToFocus();
    this.state.model.notify();
  }

  renderValues() {
    const values = this.state.model.getValues();
    return (
      <div
        className={cn(classes.listWrapper, this.props.className)}
        ref={this.ref}
        tabIndex={this.props.tabIndex == null ? this.props.onSelect && 0 : this.props.tabIndex}
        onKeyDown={this.onKeyDown}
        onScroll={e => this.onScroll(e)}
      >
        {values.length == 0 && this.props.noDataToDisplay}
        {values.map(this.renderItem)}
      </div>
    );
  }

  renderHeader(item: Item) {
    if (!item || this.props.cards)
      return null;

    let jsx: React.ReactChild | string;
    if (typeof item.render != 'function')
      jsx = item.render || item.value || '';
    else
      jsx = item.render(item);

    if (typeof jsx == 'object' && this.props.cards) {
      jsx = React.cloneElement(jsx, { style: {...jsx.props.style, position: 'absolute', left: 0, top: 0, right: 0, bottom: 0} });
    } else if (typeof jsx == 'string' && jsx.trim() == '') {
      jsx = <span style={{visibility: 'hidden'}}>?</span>;
    }

    return (
      <div className={classes.headerWrap}>
        <FitToParent
          render={() => {
            const w = this.ref.current ? this.ref.current.offsetWidth - this.ref.current.clientWidth : 0;
            return (
              <div className={classes.header} /*style={{ marginRight: w }}*/>
                <div className={classes.item}>
                  {jsx}
                </div>
              </div>
            );
          }}
        />
      </div>
    );
  }

  renderItem = (item: Item, idx: number) => {
    let jsx: React.ReactChild | string;
    if (typeof item.render != 'function')
      jsx = item.render || item.value || '';
    else
      jsx = item.render(item);

    if (typeof jsx == 'object' && this.props.cards) {
      jsx = React.cloneElement(jsx, { style: {...jsx.props.style, position: 'absolute', left: 0, top: 0, right: 0, bottom: 0} });
    } else if (typeof jsx == 'string' && jsx.trim() == '') {
      jsx = <span style={{visibility: 'hidden'}}>?</span>;
    }

    const select = this.state.model.getSelect().indexOf(item) != -1 || this.state.drag == item;
    const className = cn(
      this.props.cards ? classes.cardItem : classes.item,
      idx == this.state.model.getFocus() && classes.focus,
      select && classes.select,
      this.props.itemClassName,
      item.className,
      this.props.onDragAndDropTo && this.state.drop == item && classes.dropInto
    );

    const style = this.props.cards ? {
      width: this.props.cardWidth || DEFAULT_CARD_WIDTH,
      height: this.props.cardHeight || DEFAULT_CARD_HEIGHT
    } : {};

    return (
      <div
        data-itemidx={idx}
        style={style}
        key={idx}
        title={item.title || this.getLabel(item)}
        className={className}
        onClick={e => {
          this.ref.current.focus();
          if (!this.props.onSelect)
            return;

          const m = this.state.model;
          let sel = new Set(m.getSelect());

          if (e.ctrlKey && this.props.multiselect) {
            if (sel.has(item))
              sel.delete(item);
            else
              sel.add(item);
          } else if (sel.size == 1 && sel.has(item)) {
            return;
          } else {
            sel = new Set([ item ]);
          }

          m.setSelect(Array.from(sel));
          this.props.onSelect(m.getSelect());
        }}
        onMouseDown={e => this.onMouseDown(item, idx, e)}
      >
        {this.renderMoveToLine(item)}
        {jsx}
      </div>
    );
  }

  renderMoveToLine(item: Item) {
    if (this.state.drop != item)
      return null;

    if (this.props.cards) {
      return (
        <div
          style={{ position: 'absolute', opacity: 0.5, top: 0, bottom: 0, width: 5, backgroundColor: 'silver' }}
        />
      );
    }

    return (
      <div
        style={{position: 'absolute', opacity: 0.5, left: 0, right: 0, height: 5, backgroundColor: 'silver'}}
      />
    );
  }

  onMouseDown(item: Item, idx: number, e: React.MouseEvent) {
    if (!this.props.onDragAndDropTo && !this.props.onMoveTo)
      return;

    this.ref.current.focus();
    let dragTo: HTMLElement;
    let scrollY: number = 0;

    let timer: Timer = new Timer(() => {
      this.ref.current.scrollTo(0, this.ref.current.scrollTop + scrollY * 5);
    });

    const bbox = this.ref.current.getBoundingClientRect();
    startDragging({x: 0, y: 0, minDist: 5}, {
      onDragStart: () => {
        this.setState({ drag: item });
        if (!this.props.onSelect)
          return;

        const m = this.state.model;
        let sel = m.getSelect();
        if (sel.length == 0)
          sel = [ item ];

        m.setSelect(sel);
        this.props.onSelect(m.getSelect());
      },
      onDragging: evt => {
        const me: MouseEvent = evt.event as MouseEvent;
        const ydiff = me.pageY - bbox.top;
        if (ydiff > bbox.height) {
          scrollY = 1;
        } else if(me.pageY - bbox.top < 0) {
          scrollY = -1;
        } else {
          scrollY = 0;
          timer.stop();
        }

        if (scrollY != 0 && !timer.isRunning())
          timer.runRepeat(20);

        const el = findParentByFunc(evt.event.target as HTMLElement, (p => p.getAttribute('data-itemidx') != null));
        if (dragTo == el)
          return;

        dragTo = el as HTMLElement;
        if (!dragTo) {
          this.setState({ drop: null });
        } else {
          const itemIdx = +dragTo.getAttribute('data-itemidx');
          const values = this.state.model.getValues();
          if (itemIdx == idx) {
            this.setState({ drop: null });
          } else if (itemIdx != null && itemIdx < values.length) {
            this.setState({ drop: values[itemIdx] });
          }
        }
      },
      onDragEnd: () => {
        timer.stop();
        const { drop } = this.state;
        const drag = item;

        this.setState({ drop: null, drag: null });
        if (!drop)
          return;

        if (this.props.onDragAndDropTo)
          this.props.onDragAndDropTo({ drag: [ drag ], drop });

        if (this.props.onMoveTo) {
          const newArr = this.state.model.getValues().slice();
          const dragIdx = newArr.indexOf(drag);
          let beforeIdx = newArr.indexOf(drop);
          if (dragIdx != -1 && beforeIdx != -1 && dragIdx + 1 != beforeIdx) {
            newArr.splice(dragIdx, 1);

            beforeIdx = newArr.indexOf(drop);
            newArr.splice(beforeIdx, 1, drag, drop);
            const args: MoveToArgs = {
              drag: [ item ],
              before: drop,
              newArr
            };
            this.props.onMoveTo(args);
          }
        }

        this.state.model.setFocus( this.state.model.getValues().indexOf(item) );
      }
    })(e.nativeEvent);
  };

  onScroll(e: React.UIEvent) {
    this.props.onScroll && this.props.onScroll(e);
  }

  render() {
    let maxHeight = this.getMaxHeight();
    if (this.props.maxHeight)
      maxHeight = Math.min(maxHeight, this.props.maxHeight);

    const style: React.CSSProperties = {
      ...this.props.style,
      width: this.props.width,
      height: this.props.height,
      maxHeight
    };

    const className = cn(
      classes.class,
      this.props.className,
      this.props.itemPadding == false && classes.noItemPadding,
      this.props.border != false && classes.border,
      this.props.highlight != false && classes.highlight,
      this.props.cards && classes.cards
    );

    return (
      <div
        className={className}
        style={style}
      >
        {this.renderHeader(this.props.header)}
        {this.renderValues()}
      </div>
    );
  }
}
