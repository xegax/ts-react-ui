import * as React from 'react';
import { IconMap } from './icon-map';
import { IconSVG } from '../icon-svg';
import { CSSIcon } from '../cssicon';
import * as LayourRows from '../icons/svg/rows.svg';
import * as LayoutCols from '../icons/svg/columns.svg';

export { IconMap };

IconMap.get().append({
  'rows':     <IconSVG icon={LayourRows}/>,
  'columns':  <IconSVG icon={LayoutCols}/>,
  'empty':    <CSSIcon icon='fa fa-file-o'/>,
  'lock':     <CSSIcon icon='fa fa-lock'/>
});
