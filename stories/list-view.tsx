import * as React from 'react';
import { FitToParent } from '../src/fittoparent';
import { storiesOf } from '@storybook/react';
import { ListViewLoadable, Item } from '../src/list-view-loadable';

interface State {
  viewType?: 'cards' | 'list';
  rndData?: number;
}

class Dummy extends React.Component<{}, State> {
  private ref = React.createRef<ListViewLoadable>();
  state: State = { viewType: 'list', rndData: Math.round(Math.random() * 100) };

  renderButtons() {
    return (
      <div className='horz-panel-1'>
        <button>
          reverse
        </button>
        <button onClick={() => this.setViewType('cards')}>
          cards
        </button>
        <button onClick={() => this.setViewType('list')}>
          list
        </button>
        <button onClick={() => this.updateItemsData()}>
          update tems data
        </button>
      </div>
    );
  }

  updateItemsData() {
    this.setState({ rndData: Math.round(Math.random() * 100) });
  }

  setViewType(viewType: 'cards' | 'list') {
    this.setState({ viewType });
  }

  renderItem = (item: Item) => {
    if (this.state.viewType == 'cards') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ textAlign: 'center' }}>value: {item.value}</div>
          <div style={{ display: 'flex', flexGrow: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
            rnd: {this.state.rndData}
          </div>
          <div style={{ textAlign: 'center' }}>footer</div>
        </div>
      );
    }

    return (
      <div>
        <div>{item.value}</div>
        <div>rnd: {this.state.rndData}</div>
      </div>
    );
  }

  makeItem(idx: number): Item {
    return {
      value: '' + idx,
      render: this.renderItem
    };
  }

  renderView() {
    return (
      <div style={{display: 'flex', flexDirection: 'column', flexGrow: 1}}>
        <FitToParent wrapToFlex>
          <ListViewLoadable
            cards={this.state.viewType == 'cards'}
            itemsPerLoad={100}
            values={null}
            // key={this.state.viewType}
            ref={this.ref}
            totalValues={() => 500}
            onSelect={() => {}}
            onLoadNext={(from, count) => {
              return Promise.resolve( Array(count).fill(null).map((v, idx) => this.makeItem(from + idx)) );
            }}
            onMoveTo={args => {
              const m = this.ref.current.getModel();
              const vals = m.getValues();

              const drag = vals.findIndex(item => item == args.drag[0]);
              vals.splice(drag, 1);

              const drop = vals.findIndex(item => item == args.before);
              vals.splice(drop, 0, args.drag[0]);

              m.notify();
            }}
          />
        </FitToParent>
      </div>
    );
  }

  render() {
    return (
      <div style={{
          position: 'absolute',
          left: 0, top: 0, right: 0, bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {this.renderButtons()}
        {this.renderView()}
      </div>
    );
  }
}

function makeItem(idx: number, bg?: string) {
  return {
    value: '' + idx,
    render: () => {
      return (
        <div style={{backgroundColor: bg}}>
          <span>idx={idx} </span>
          data={Math.round(Math.random() * 100)}
        </div>
      )
    }
  };
}

storiesOf('List view', module)
  .add('Loadable', () => {
    return (
      <Dummy/>
    );
  });
