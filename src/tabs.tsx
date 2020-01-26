import * as React from 'react';
import { cn } from './common/common';
import { ElementType, render } from './react-common';
import { CSSIcon } from './cssicon';

const css = {
  TabsCtrl: 'tabs-ctrl',
  TabCtrl: 'tab-ctrl',
  TabWrap: 'tab-wrap',
  Background: 'background',
  Select: 'select',
  disabled: 'disabled',
  Content: 'tab-content',
  tabsWrap: 'tabs-wrap',
  spacer: 'tabs-spacer'
};

interface Props {
  disabled?: boolean;
  background?: boolean;
  select?: string;
  defaultSelect?: string;
  onSelect?(id: string): void;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}

interface State {
  select?: string;
}

export class Tabs extends React.Component<Props, State> {
  static defaultProps: Props = {
    background: true
  };

  state: Readonly<State> = { select: this.props.defaultSelect };
  ref = React.createRef<HTMLDivElement>();

  getOnSelect(tab: TabProps) {
    return () => {
      this.setState({ select: this.props.select || tab.id });
      tab.onSelect &&  tab.onSelect(tab.id);
      this.props.onSelect && this.props.onSelect(tab.id);
    };
  }

  static getDerivedStateFromProps(props: Props, state: State): State {
    return { select: props.select || state.select };
  }

  onWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY / Math.abs(e.deltaY);
    this.ref.current.scrollLeft += delta * 15;
    e.preventDefault();
    e.stopPropagation();
  }

  render() {
    let children = React.Children.map(this.props.children, (tab: React.ReactElement<TabProps>) => {
      if (!tab.props.show)
        return null;

      return (
        React.cloneElement(tab, {
          onSelect: this.getOnSelect(tab.props),
          select: tab.props.select != null ? tab.props.select : this.state.select == tab.props.id
        })
      );
    }).filter(c => c);

    const selectTab = children.find(tab => {
      return tab.props.select != null ? tab.props.select : this.state.select == tab.props.id;
    });

    let tabContent: JSX.Element;
    if (selectTab) {
      tabContent = (
        <div className={css.Content} style={{maxHeight: this.props.height}}>
          {selectTab.props.children}
        </div>
      );
    }

    return (
      <div
        className={cn(css.TabsCtrl, this.props.disabled && css.disabled, this.props.background && css.Background)}
        style={{...this.props.style, width: this.props.width}}
      >
        <div ref={this.ref} className={css.tabsWrap} onWheel={this.onWheel}>
          <div className={css.spacer} style={{ width: 5, flexShrink: 0, flexGrow: 0 }}/>
          {children}
          <div className={css.spacer}/>
        </div>
        {tabContent}
      </div>
    );
  }
}

interface TabProps {
  icon?: ElementType;
  label?: ElementType;
  show?: boolean;
  maxWidth?: number;
  id: string;
  select?: boolean;
  onSelect?(id: string): void;
  children?: React.ReactNode;
}

export class Tab extends React.Component<TabProps> {
  static defaultProps: Partial<TabProps> = {
    show: true
  };

  onClick = () => {
    this.props.onSelect && this.props.onSelect(this.props.id);
  }

  renderIcon() {
    if (typeof (this.props.icon) == 'string') {
      return (
        <CSSIcon
          icon={this.props.icon}
        />
      );
    }

    return render(this.props.icon);
  }

  render() {
    return (
      <div
        className={cn(css.TabCtrl, this.props.select && css.Select)}
        onClick={this.onClick}
        style={{maxWidth: this.props.maxWidth}}
      >
        <div className={cn(css.TabWrap, 'horz-panel-1')}>
          {this.renderIcon()}
          {this.props.label && <span>{render(this.props.label)}</span>}
        </div>
      </div>
    );
  }
}
