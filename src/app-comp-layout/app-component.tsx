import * as React from 'react';
import { className as cn } from '../common/common';

const scss = {
  componentIcon: 'app-component-icon'
};

export interface Props {
  title?: string;
  faIcon?: string;
  select?: boolean;
  id: string;
  onSelect?(id: string): boolean;
  children?: React.ReactChild | Array<React.ReactChild>;
  style?: React.CSSProperties;
}

export const AppComponent: React.SFC<Props> = props => {
  const onClick = () => {
    props.onSelect && props.onSelect(props.id);
  };

  return (
    <div
      className={cn(scss.componentIcon, props.select && 'select')}
      title={props.title}
      onClick={onClick}
    >
      <i className={cn(props.faIcon)}/>
    </div>
  );
}
