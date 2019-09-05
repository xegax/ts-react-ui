import * as React from 'react';

export interface Props {
  src: string;
  size?: string;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  title?: string;
}

export const Icon = (props: Props): JSX.Element => {
  const width = props.width;
  const height = props.height;
  let src = props.src;
  if (src)
    src = `url(${src})`;

  return (
    <div
      className={'icon-div ' + (props.size || '')}
      title={props.title}
      style={{
        ...props.style,
        width, height,
        minWidth: width,
        minHeight: height,
        backgroundImage: src
      }}
    />
  );
}
