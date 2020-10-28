import * as React from 'react';
import { prompt } from '../prompt';
import { EntEditor, EntRenderProps } from './helpers';

export interface LinkData {
  href: string;
}

export const Link: React.SFC<EntRenderProps<LinkData>> = props => {
  return (
    <a
      style={props.styles}
      href={props.data.href}
    >
      {props.children}
    </a>
  );
}

export function linkEditor(): EntEditor<LinkData> {
  return {
    icon: 'fa fa-link',
    name: 'Link',
    css: 'ent-link',
    edit: ent => {
      return (
        prompt({ title: 'Edit link', value: ent.data.href })
        .then(href => ({
          ...ent,
          data: { href }
        }))
      );
    },
    append: () => {
      return (
        prompt({ title: 'Append link' })
        .then(href => {
          return {
            label: 'link',
            data: { href }
          };
        })
      );
    }
  };
}
