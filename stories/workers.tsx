import * as React from 'react';
import { cpHost } from '../src/worker';

import { storiesOf } from '@storybook/react';

const host = cpHost();

storiesOf('workers', module)
  .add('worker', () => {
    return (
      <>
        <button onClick={() => {
          const calc = host.run({ module: 'test.worker.js', createNew: true });
          calc.get('calc', [1, 2, 3], 'min')
          .then(res => {
            console.log(res);
            calc.exit();
          });
        }}>
          start calculate
        </button>
      </>
    );
  });
