import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Publisher } from 'objio/common/publisher';
import { Subscriber } from './subscriber';

let idCounter = 0;
export class ContItem {
  private jsx: JSX.Element;
  private model: ContainerModel;
  private id: string = 'id_' + idCounter++;
  private ref: React.RefObject<HTMLElement> = React.createRef<HTMLElement>();

  constructor(jsx: JSX.Element, cont: ContainerModel) {
    this.jsx = React.cloneElement(jsx, { key: this.id, ref: this.ref });
    this.model = cont;
  }

  remove(): void {
    this.model.remove(this);
    this.model = null;
  }

  get(): JSX.Element {
    return this.jsx;
  }

  set(jsx: JSX.Element) {
    this.id = 'id_' + idCounter++;
    this.jsx = React.cloneElement(jsx, { key: this.id, ref: this.ref });
    this.model.delayedNotify();
  }

  getElement(): HTMLElement {
    return this.ref.current;
  }
}

export interface ContainerModelArgs {
  className: string;
  style: Partial<CSSStyleDeclaration>;
}

export class ContainerModel extends Publisher {
  private list = Array<ContItem>();
  private static global: ContainerModel;
  private parent: HTMLElement;

  constructor(args?: Partial<ContainerModelArgs>) {
    super();

    args = args || {};

    this.parent = document.createElement('div');
    if (args.className)
      this.parent.className = args.className;

    if (args.style)
      Object.keys(args.style).forEach(key => this.parent.style[key] = args.style[key]);

    document.body.appendChild(this.parent);
    ReactDOM.render(<Container model={this}/>, this.parent);
  }

  append(el: JSX.Element): ContItem {
    const item = new ContItem(el, this);
    this.list.push(item);
    this.delayedNotify();
    return item;
  }

  remove(item: ContItem): void {
    this.list.splice(this.list.indexOf(item), 1);
    this.delayedNotify();
  }

  getItems(): Array<ContItem> {
    return this.list;
  }

  static get(): ContainerModel {
    if (!ContainerModel.global)
      this.global = new ContainerModel();

    return ContainerModel.global;
  }
}

export interface Props {
  model: ContainerModel;
}

export class Container extends Subscriber<Props> {
  render() {
    return (
      this.props.model.getItems().map(item => {
        return item.get();
      })
    );
  }
}
