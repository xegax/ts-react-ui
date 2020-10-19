import * as React from 'react';
import { cn } from './common/common';
import { PopoverIcon, Classes, Position } from './popover';

export const css = {
  ColorSwatches: 'color-swatches',
  RowOfColor: 'color-swatches-row',
  ColorItem: 'color-swatches-item',
  Color: 'color-swatches-color'
};

export const palette1 = [
  ['#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff'],
  ['#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff'],
  ['#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc'],
  ['#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd'],
  ['#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0'],
  ['#a61c00', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#3d85c6', '#674ea7', '#a64d79'],
  ['#85200c', '#990000', '#b45f06', '#bf9000', '#38761d', '#134f5c', '#1155cc', '#0b5394', '#351c75', '#741b47'],
  ['#5b0f00', '#660000', '#783f04', '#7f6000', '#274e13', '#0c343d', '#1c4587', '#073763', '#20124d', '#4c1130']
];

interface Props {
  colors: Array<Array<string>>;
  value: string;
  onSelect(color: string): void;
}

const ColorRow: React.SFC<{ colors: Array<string>; value?: string }> = props => {
  const columns = props.colors.map(color => {
    return (
      <div
        className={cn(css.ColorItem, Classes.POPOVER_DISMISS)}
        style={{
          border: props.value == color ? '1px solid black' : undefined,
          backgroundColor: props.value == color ? 'silver' : undefined
        }}
      >
        <div
          className={css.Color}
          data-value={color}
          style={{
            backgroundColor: color
          }}
        >
        </div>
      </div>
    );
  });

  return (
    <div className={cn(css.RowOfColor, 'horz-panel-1')}>
      {columns}
    </div>
  );
};

export const ColorSwatches: React.SFC<Props> = props => {
  const onClick = (e: React.MouseEvent) => {
    const color = (e.target as HTMLElement).getAttribute('data-value');
    if (!color)
      return;

    props.onSelect(color);
  };

  return (
    <div
      className={cn(css.ColorSwatches, 'vert-panel-1')}
      onClick={onClick}
    >
      {props.colors.map((row, i) => (
        <ColorRow
          key={i}
          colors={row}
          value={props.value}
        />
      ))}
    </div>
  );
};

interface ButtonProps {
  cssIcon: string;
  onSelect(color: string): void;
  color?: string;
}

export const ColorSwatchesButton: React.SFC<ButtonProps> = props => {
  return (
    <div className={cn('popover-wrapper-flex')}>
      <PopoverIcon
        icon={props.cssIcon}
        style={{ color: props.color }}
        position={Position.BOTTOM_LEFT}
      >
        <ColorSwatches
          colors={palette1}
          value={props.color}
          onSelect={props.onSelect}
        />
      </PopoverIcon>
    </div>
  );
}

export const Button = ColorSwatchesButton;
export const Control = ColorSwatches;
