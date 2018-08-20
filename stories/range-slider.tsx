import * as React from 'react';

import { storiesOf } from '@storybook/react';
import { RangeSlider, RangeSliderModel } from '../src/range-slider';
import { FitToParent } from '../src/fittoparent';

const model = new RangeSliderModel();
model.setRange({from: 0.5, to: 0.5});

storiesOf('range slider', module)
  .add('with some emoji', () => (
    <div>
      <FitToParent><RangeSlider model={model}/></FitToParent>
    </div>
  ));