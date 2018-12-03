import * as React from 'react';
import { className as cn } from '../common/common';

const classes = {
  componentIcon: 'app-component-icon'
};

export interface Props {
  title?: string;
  faIcon?: string;
  select?: boolean;
  id: string;
  onSelect?(id: string);
  children?: React.ReactChild | Array<React.ReactChild>;
}

export const AppComponent: React.SFC<Props> = (props: Props) => {
  return (
    <div
      className={cn(classes.componentIcon, props.select && 'select')}
      onClick={() => props.onSelect && props.onSelect(props.id)}
    >
      <i className={cn(props.faIcon)}/>
    </div>
  );
}
