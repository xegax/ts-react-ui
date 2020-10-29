import * as React from 'react';
import {
  ContentBlock,
  ContentState
} from 'draft-js';
import { OrderedSet } from 'immutable';

export interface LeafProps {
  text: string;
  styleSet: OrderedSet<string>;
}

export interface EntProps {
  children: Array<React.ReactElement<LeafProps>>;
  contentState: ContentState;
  entityKey: string;
  offsetKey: string;
  blockKey: string;
}

export interface EntData<T = any> {
  label: string;
  key?: string;
  data?: T;
  styles?: Array<string>;
  className?: string;
}

export interface EntEditor<T = any> {
  icon: string;
  name: string;
  css?: string;
  append(): Promise<EntData<T>>;
  edit(ent: EntData<T>): Promise<EntData<T>>;
}

export interface EntRenderProps<T = any> {
  data: T;
  styles: React.CSSProperties;
}

export function makeEntFindStrategy(type?: string) {
  return (block: ContentBlock, callback: (start: number, end: number) => void, state: ContentState) => {
    block.findEntityRanges(metadata => {
      const entKey = metadata.getEntity();
      if (entKey == null)
        return false;

      const entType = state.getEntity(entKey).getType();
      return type != null ? entType == type : entType != null;
    }, callback);
  };
}

let predefinedStyle: Record<string, React.CSSProperties> = {
  'BOLD': { fontWeight: 'bold' },
  'ITALIC': { fontStyle: 'italic' },
  'UNDERLINE': { textDecoration: 'underline' }
};

export function makeStyle(styleSet: OrderedSet<string>, styles: Record<string, React.CSSProperties>): React.CSSProperties {
  let res: React.CSSProperties = {};
  styleSet.toArray().forEach(key => {
    res = {...res, ...predefinedStyle[key], ...styles[key]};
  });
  return res;
}
