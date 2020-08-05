import * as React from 'react';
import { SwitchPropItem, DropDownPropItem2 } from '../prop-sheet';
import { GridViewModel } from './grid-view-model';
import { Tags } from '../tags';

interface Props {
  model: GridViewModel;
}

interface State {
  model?: GridViewModel;
  subscriber?(): void;
}

export class GridPanelSort extends React.Component<Props> {
  constructor(props: Props) {
    super(props);

    this.state = {
      subscriber: () => {
        this.setState({});
      }
    };
  }

  static getDerivedStateFromProps(next: Props, state: State): State | null {
    if (next.model != state.model) {
      state.model?.unsubscribe(state.subscriber);
      next.model?.subscribe(state.subscriber);

      return { model: next.model };
    }
    return null;
  }

  render() {
    const m = this.props.model;
    const appr = m.getAppr();
    return (
      <>
        <DropDownPropItem2
          label='Schema'
          values={[]}
        />
        <Tags
          values={appr.sort.columns.map(c => {
            return {
              value: c.name,
              removeable: true
            };
          })}
          onRemove={c => {
            m.setApprChange({ sort: { columns: appr.sort.columns.filter(col => col.name != c.value) } });
          }}
        />
        <SwitchPropItem
          label='Reverse'
          value={appr.sort.reverse}
          onChanged={reverse => {
            m.setApprChange({ sort: { reverse } });
          }}
        />
      </>
    );
  }
}
