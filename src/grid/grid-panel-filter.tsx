import * as React from 'react';
import { Subscriber } from '../subscriber';
import { GridViewModel } from './grid-view-model';
import { FilterPanelView } from '../panel/filter-panel';

interface Props {
  model: GridViewModel;
}

export class GridPanelFilter extends React.Component<Props> {
  private getFilterModel() {
    return this.props.model.getFiltersPanel();
  }

  private renderPanel = () => {
    return (
      <FilterPanelView
        model={this.getFilterModel()}
      />
    );
  };

  render() {
    return (
      <Subscriber
        model={this.props.model}
        render={this.renderPanel}
      />
    );
  }
}
