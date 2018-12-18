import * as React from 'react';

export const Icon = (props: { src: string, size?: string, width?: number; height?: number }): JSX.Element => {
  const width = props.width;
  const height = props.height;
  return (
    <div
      className={'icon-div ' + (props.size || '')}
      style={{
        width, height,
        backgroundImage: `url(/data/image/${props.src})`
      }}
    />
  );
}
