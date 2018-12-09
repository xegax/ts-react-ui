import * as React from 'react';
import { className as cn } from '../common/common';
import { VerticalResizer } from '../resizer';
import { AppComponent, Props as CompProps } from './app-component';
import { AppContent } from './app-content';

export { AppComponent, AppContent };

const classes = {
  appCompLayout: 'app-comp-layout',
  component: 'app-component',
  componentWrap: 'app-component-wrap',
  appCompIcons: 'app-comp-icons'
};

interface Props {
  defaultWidth?: number;
  defaultSelect?: string;
  select?: string;

  onSelect?(id: string);
}

interface State {
  select?: string;
  width?: number;
}

export class AppCompLayout extends React.Component<Props, State> {
  state: Readonly<State> = {
    select: this.props.defaultSelect,
    width: this.props.defaultWidth || 200
  };

  getOnSelect(props: CompProps) {
    return () => {
      if (props.onSelect && !props.onSelect(props.id))
        return false;

      if (this.state.select == props.id)
        this.setState({ select: null});
      else
        this.setState({ select: props.id});
      this.props.onSelect && this.props.onSelect(props.id);
      return true;
    };
  }

  renderComponent(props: CompProps) {
    if (!props || !props.children)
      return null;

    return (
      <div className={classes.component} style={{ width: this.state.width }}>
        <div className={classes.componentWrap} style={props.style}>{props.children}</div>
        <div style={{position: 'relative'}}>
          <VerticalResizer
            style={{ left: 0, right: 'unset' }}
            max={500}
            min={50}
            size={this.state.width}
            onResize={newSize => this.setState({width: newSize})}
          />
        </div>
      </div>
    );
  }

  render() {
    let content: React.ReactElement<any>;
    let compProps: CompProps;
    const children = React.Children.toArray(this.props.children)
    .map((item: React.ReactElement<CompProps>) => {
      if (item.type == AppContent) {
        content = item;
        return null;
      }

      const select = (this.props.select || this.state.select) == item.props.id;
      if (select)
        compProps = item.props;

      return React.cloneElement(item, {
        select,
        onSelect: this.getOnSelect(item.props)
      });
    }).filter(item => item);

    return (
      <div className={cn(classes.appCompLayout, 'flex')}>
        <div className={cn(classes.appCompIcons, 'padding-2', 'vert-panel-2')}>
          {children}
        </div>
        {this.renderComponent(compProps)}
        {content}
      </div>
    );
  } 
}
