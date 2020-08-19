import { CSSRect } from '../common/rect';
import { Size } from '../common/point';

export interface Box {
  key?: string;
  rect: Partial<CSSRect & Size>;
  children?: Array<Box>;
}
