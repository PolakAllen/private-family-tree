import type { CSSProperties } from 'react';
import React from 'react';

export interface CellImageProps {
  image: string;
  /** Top-left of the crop, in image px. May be outside the image (renders blank). */
  x: number;
  y: number;
  width: number;
  height: number;
  className?: string;
  label?: string;
}

export const CellImage = React.memo(function CellImage({
  image, x, y, width, height, className, label,
}: CellImageProps) {
  const style: CSSProperties = {
    width,
    height,
    backgroundImage: `url("${image}")`,
    backgroundPosition: `${-x}px ${-y}px`,
    backgroundRepeat: 'no-repeat',
    flex: '0 0 auto',
  };
  return (
    <div
      className={`pe-crop${className ? ' ' + className : ''}`}
      style={style}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
});