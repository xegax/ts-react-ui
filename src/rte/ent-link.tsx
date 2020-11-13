import * as React from 'react';
import { promptRecord } from '../prompt';
import { EntEditor, EntRenderProps } from './helpers';

export interface LinkData {
  href: string;
}

export const Link: React.SFC<EntRenderProps<LinkData>> = props => {
  return (
    <a
      style={props.styles}
      href={props.data.href}
      onClick={props.onClick}
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
    edit: args => {
      return (
        promptRecord({ title: 'Edit link', value: { Text: args.text, URL: args.data.href } })
        .then(res => ({
          text: res.Text,
          data: { href: res.URL }
        }))
      );
    },
    append: () => {
      return (
        promptRecord({ title: 'Append link', value: { Text: '', URL: '' } })
        .then(res => {
          return {
            text: res.Text,
            data: { href: res.URL }
          };
        })
      );
    }
  };
}
