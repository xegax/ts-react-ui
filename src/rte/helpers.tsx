import * as React from 'react';
import {
  ContentBlock,
  ContentState
} from 'draft-js';

export interface EntProps {
  children: JSX.Element;
  contentState: ContentState;
  entityKey: string;
  offsetKey: string;
}

export interface EntData<T = any> {
  label: string;
  key?: string;
  data?: T;
  styles?: Array<string>;
  className?: string;
}

export function makeEntFindStrategy() {
  return (block: ContentBlock, callback: (start: number, end: number) => void, state: ContentState) => {
    block.findEntityRanges(metadata => {
      const entKey = metadata.getEntity();
      return (entKey != null && state.getEntity(entKey).getType() != null);
    }, callback);
  };
}
