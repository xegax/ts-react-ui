import * as React from 'react';
import { cn } from './common/common';
import * as svgWarning from './icons/svg/warning.svg';
import * as svgError from './icons/svg/error.svg';

export type IconSize = 'x-large' | 'large' | 'small';
const css = {
  iconSVG: 'icon-svg'
};

interface Props {
  icon: string;
  style?: React.CSSProperties;
  size?: IconSize;
  status?: 'error' | 'warning';
}

export function IconSVG(p: Props) {
  return (
    <div className={cn(css.iconSVG, p.size)} style={p.style}>
      <div
        className='abs-fit'
        dangerouslySetInnerHTML={{ __html: p.icon }}
      />
      {p.status == 'error' && svgStatus(svgError, 'red')}
      {p.status == 'warning' && svgStatus(svgWarning, '#009dff')}
    </div>
  );
}

function svgStatus(icon: string, color: string) {
  return (
    <IconSVG
      style={{ position: 'absolute', right: 0, bottom: 0, color }}
      icon={icon}
      size='small'
    />
  );
}

function status(icon: string) {
  return (
    <>
      <i
        className='fa fa-circle'
        style={{ position: 'absolute', right: 0, bottom: 0, fontSize: '50%', color: 'white' }}
      />
      <i
        className={icon}
        style={{ position: 'absolute', right: 0, bottom: 0, fontSize: '50%', color: 'red' }}
      />
    </>
  );
}
