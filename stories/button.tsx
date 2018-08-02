import * as React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { ContainerModel } from '../src/container';
import { Draggable, Droppable } from '../src/drag-and-drop';

storiesOf('Button', module)
  .add('with text', () => <button onClick={action('clicked')}>Hello Button 2</button>)
  .add('with some emoji', () => (
    <button onClick={action('clicked')}>
      <span role="img" aria-label="so cool">
        😀 😎 👍 💯
      </span>
    </button>
  ))
  .add('container', () => {
    return (
      <React.Fragment>
      <Draggable>
        <button onClick={() => {
          const text = (
            <div
              onClick={() => {
                const el = item.getElement();
                el.style.left = Math.random() * 500 + 'px';
                el.style.top = Math.random() * 500 + 'px'; 
                el.style.backgroundColor = '#' + Math.round(Math.random() * 0xffffff).toString(16);
              }}
              style={{position: 'absolute', left: Math.random() * 500, top: Math.random() * 500}}
            >
            Test!!
            </div>
          );
          const item = ContainerModel.get().append(text);
        }}>
        add
        </button>
      </Draggable>
      <Droppable>
        <div style={{position: 'absolute', left: 50, top: 100, width: 200, height: 100, backgroundColor: 'silver'}}>drop area</div>
      </Droppable>
      </React.Fragment>
    );
  });