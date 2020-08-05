import * as React from 'react';
import { SwitchPropItem, DropDownPropItem2, Item, TextPropItem } from '../prop-sheet';
import { GridViewModel } from './grid-view-model';
import { Tabs, Tab } from '../tabs';
import { FontProp, FontAppr } from '../prop-sheet/font-prop';
import { PropGroup2 } from '../prop-sheet/props-group2';
import { GridViewType } from './grid-view-appr';
import { ColorProp } from '../prop-sheet/color-prop';

interface Props {
  grid?: GridViewModel;
}

interface State {
  grid?: GridViewModel;
  subscriber?: () => void;
}

const viewType: Array<Item> = [
  { value: 'rows' },
  { value: 'cards' }
];

export class GridPanelAppr extends React.Component<Props> {
  constructor(props: Props) {
    super(props);

    this.state = {
      subscriber: () => {
        this.setState({});
      }
    };
  }

  static getDerivedStateFromProps(next: Props, state: State): State | null {
    if (next.grid != state.grid) {
      state.grid?.unsubscribe(state.subscriber);
      next.grid?.subscribe(state.subscriber);

      return { grid: next.grid };
    }
    return null;
  }

  private renderCardTab() {
    const appr = this.props.grid.getAppr();
    return (
      <Tab
        id='cards'
        key='cards'
        icon='fa fa-id-card-o'
      >
        <SwitchPropItem
          label='Border'
          value={appr.cardsView.border}
          onChanged={border => {
            this.props.grid.setApprChange({ cardsView: { border } });
          }}
        />
        <TextPropItem
          label='Padding'
          value={appr.cardsView.padding}
          onEnterNum={padding => {
            this.props.grid.setApprChange({ cardsView: { padding } });
          }}
        />
        <ColorProp
          color={appr.cardsView.color}
          onChange={color => {
            this.props.grid.setApprChange({ cardsView: { color } });
          }}
        />
        <TextPropItem
          label='Width'
          value={appr.cardsView.width}
          onEnterNum={width => {
            this.props.grid.setApprChange({ cardsView: { width } });
          }}
        />
        <TextPropItem
          label='Height'
          value={appr.cardsView.height}
          onEnterNum={height => {
            this.props.grid.setApprChange({ cardsView: { height } });
          }}
        />
      </Tab>
    );
  }

  private renderApprTab() {
    const m = this.props.grid;
    const appr = m.getAppr();
    const apprRef = m.getApprRef();
    return (
      <Tab
        id='common'
        key='common'
        icon='fa fa-paint-brush'
        title='Appearance'
      >
        <PropGroup2 defaultOpen label='Body'>
          <FontProp
            font={appr.body.font as FontAppr}
            modified={apprRef.isModified('body', 'font')}
            onChange={font => {
              m.setApprChange({ body: { font }});
            }}
            onReset={() => {
              m.modifyAppr(ref => ref.resetToDefault('body', 'font'));
            }}
          />
          <SwitchPropItem
            label='Border'
            value={appr.body.border}
            onChanged={() => {
              m.setApprChange({ body: { border: !appr.body.border } });
            }}
          />
        </PropGroup2>
        <PropGroup2 defaultOpen label='Header'>
          <FontProp
            font={appr.header.font as FontAppr}
            modified={apprRef.isModified('header', 'font')}
            onChange={font => {
              m.setApprChange({ header: { font }});
            }}
            onReset={() => {
              m.modifyAppr(ref => ref.resetToDefault('header', 'font'));
            }}
          />
          <SwitchPropItem
            label='Show'
            value={appr.header.show}
            onChanged={() => {
              m.setApprChange({ header: { show: !appr.header.show } });
            }}
          />
        </PropGroup2>
        <DropDownPropItem2
          label='View type'
          values={viewType}
          value={viewType.find(v => v.value == appr.viewType)}
          onSelect={item => {
            m.setApprChange({ viewType: item.value as GridViewType });
          }}
        />
      </Tab>
    );
  }

  render() {
    return (
      <Tabs
        defaultSelect='common'
        flex
        background={false}
      >
        {this.renderApprTab()}
        {this.renderCardTab()}
      </Tabs>
    );
  }
}
