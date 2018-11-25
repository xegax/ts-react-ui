import * as React from 'react';
import { DropDown, Props as DDBaseProps, Item } from './drop-down';
import { ListViewLoadableModel, LoadProps, ListPropsBase, ListViewLoadable } from './list-view-loadable';

interface State {
  model?: ListViewLoadableModel;
}

interface Props extends DDBaseProps, LoadProps {
}

export class DropDownLoadable extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    let model = props.model || new ListViewLoadableModel();
    this.state = { model };
  }

  renderList = (props: ListPropsBase) => {
    return (
      <ListViewLoadable
        {...props}
        model={this.state.model}
        totalValues={this.props.totalValues}
        itemsPerLoad={this.props.itemsPerLoad}
        onLoadNext={this.props.onLoadNext}
      />
    );
  }

  onFilter = (filter: string) => {
    const p = this.props.onFilter(filter) as Promise< Array<Item> >;
    return p.then(values => {
      this.state.model.setValues(values);
      return Promise.reject(null);
    });
  }

  render() {
    return (
      <DropDown
        {...this.props}
        listModel={this.state.model}
        renderList={this.renderList}
        onFilter={this.props.onFilter ? this.onFilter : null}
      />
    );
  }
}
