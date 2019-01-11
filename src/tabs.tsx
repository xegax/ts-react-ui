import * as React from 'react';
import { className as cn } from './common/common';

const classes = {
  TabsCtrl: 'tabs-ctrl',
  TabCtrl: 'tab-ctrl',
  Select: 'select',
  disabled: 'disabled',
  Content: 'tab-content',
  tabsWrap: 'tabs-wrap',
  spacer: 'tabs-spacer'
};

interface Props {
  disabled?: boolean;
  select?: string;
  defaultSelect?: string;
  onSelect?(id: string);
  width?: number;
  height?: number;
}

interface State {
  select?: string;
}

export class Tabs extends React.Component<Props, State> {
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
      return (
        React.cloneElement(tab, {
          onSelect: this.getOnSelect(tab.props),
          select: tab.props.select != null ? tab.props.select : this.state.select == tab.props.id
        })
      );
    });
    const selectTab = children.find(tab => {
      return tab.props.select != null ? tab.props.select : this.state.select == tab.props.id;
    });

    let tabContent: JSX.Element;
    if (selectTab) {
      tabContent = (
        <div className={classes.Content} style={{maxHeight: this.props.height}}>
          {selectTab.props.children}
        </div>
      );
    }

    return (
      <div
        className={cn(classes.TabsCtrl, this.props.disabled && classes.disabled)}
        style={{width: this.props.width}}
      >
        <div ref={this.ref} className={classes.tabsWrap} onWheel={this.onWheel}>
          {children}
          <div className={classes.spacer}></div>
        </div>
        {tabContent}
      </div>
    );
  }
}

interface TabProps {
  label?: string;
  maxWidth?: number;
  id: string;
  select?: boolean;
  onSelect?(id: string);
  children?: React.ReactNode;
}

export class Tab extends React.Component<TabProps> {
  onClick = () => {
    this.props.onSelect && this.props.onSelect(this.props.id);
  }

  render() {
    return (
      <div
        className={cn(classes.TabCtrl, this.props.select && classes.Select)}
        onClick={this.onClick}
        style={{maxWidth: this.props.maxWidth}}
      >
        {this.props.label}
      </div>
    );
  }
}
