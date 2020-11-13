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

export type EntData = any;

interface EntEditArgs<T> {
  data: T;
  text: string;
}

export interface EntEditor<T = any> {
  icon: string;
  name: string;
  css?: string;
  append(): Promise<EntEditArgs<T>>;
  edit(args: EntEditArgs<T>): Promise<EntEditArgs<T>>;
}

export interface EntRenderProps<T = any> {
  data: T;
  styles: React.CSSProperties;
  onClick?(e: React.MouseEvent): void;
  onChanged(): void;
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

export function findEntText(block: ContentBlock, entKey: string) {
  let text = '';
  block.findEntityRanges(metadata => {
    return metadata.getEntity() == entKey;
  }, (start, end) => {
    text = block.getText().substr(start, end - start);
  });

  return text;
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
