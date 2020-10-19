import * as React from 'react';
import { PropItem } from './prop-item';
import { Popover, Position } from '../popover';
import { FontAppr, FontValue, FontPanel } from '../font-panel';
import { CSSIcon } from '../cssicon';

export { FontAppr };

interface Props {
  font: FontAppr;
  label?: string;
  modified?: boolean;
  onChange?(font: Partial<FontAppr>): void;
  onReset?(): void;
}

export const FontProp: React.SFC<Props> = props => {
  return (
    <PropItem label={props.label || 'Font'}>
      <div className='horz-panel-1 flex popover-wrapper-flex'>
        <Popover position={Position.BOTTOM_RIGHT}>
          <FontValue
            {...props.font}
          />
          <FontPanel
            font={{ ...props.font }}
            onChange={props.onChange}
          />
        </Popover>
        <CSSIcon
          displayFlex={false}
          disabled={!props.modified}
          icon='fa fa-refresh'
          onClick={props.onReset}
        />
      </div>
    </PropItem>
  );
}
