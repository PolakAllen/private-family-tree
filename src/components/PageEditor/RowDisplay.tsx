import type { KeyboardEvent, MouseEvent } from 'react';
import type { RowCell } from './types';
import { CellImage } from './CellImage';
import type { Cell, CellType, DateValue } from './types';
import { formatDateValue } from '../DateEditor';

export const isDateValue = (v: string | DateValue): v is DateValue => typeof v !== 'string';

export function cellText(cell: Cell | undefined): string {
  if (!cell) return '';
  return isDateValue(cell.v) ? formatDateValue(cell.v) : cell.v;
}

/**
 * A cell is "latent" when its stored value belongs to a different type than its
 * column now expects (a date sitting in a text column, or text in a date column).
 * We never convert; we just surface it.
 */
export function isLatent(cell: Cell | undefined, type: CellType): boolean {
  if (!cell || cellText(cell) === '') return false;
  return (type === 'date') !== isDateValue(cell.v);
}

const STEP = 2;
const BIG_STEP = 10;

export interface RowDisplayProps {
  image: string;
  /** y (image px) of THIS row's top edge, i.e. edges.y[r]. */
  topEdge: number;
  /** x (image px) of the table's left edge. */
  leftEdge: number;
  /** Row height in image px. */
  height: number;
  row: RowCell[];
  /** px of surrounding image shown above/below the row while it is selected. */
  edgeDragPreviewHeight: number;
  isSelected: boolean;
  onClick: () => void;
  splitRow: () => void;
  deleteRow: () => void;
  /** delta is in image px; positive = toward larger y. */
  moveEdge: (edge: 'top' | 'bottom', delta: number) => void;
}

export default function RowDisplay({
  image, topEdge, leftEdge, height, row, edgeDragPreviewHeight,
  isSelected, onClick, splitRow, deleteRow, moveEdge,
}: RowDisplayProps) {
  let x = leftEdge;
  const offsets = row.map((rc) => {
    const o = x;
    x += rc.column.width;
    return o;
  });

  const nudge = (edge: 'top' | 'bottom', sign: 1 | -1) => (e: MouseEvent) =>
    moveEdge(edge, sign * (e.shiftKey ? BIG_STEP : STEP));

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div className={`pe-row${isSelected ? ' is-selected' : ''}`}>
      {isSelected && (
        <div className="pe-tools" role="group" aria-label="Edit row">
          <button type="button" onClick={splitRow}>Split row</button>
          <button type="button" onClick={deleteRow}>Delete row</button>
          <span className="pe-tools-group">
            Top edge
            <button type="button" aria-label="Move top edge up" onClick={nudge('top', -1)}>▲</button>
            <button type="button" aria-label="Move top edge down" onClick={nudge('top', 1)}>▼</button>
          </span>
          <span className="pe-tools-group">
            Bottom edge
            <button type="button" aria-label="Move bottom edge up" onClick={nudge('bottom', -1)}>▲</button>
            <button type="button" aria-label="Move bottom edge down" onClick={nudge('bottom', 1)}>▼</button>
          </span>
          <span className="pe-tools-hint">Shift = {BIG_STEP}px steps</span>
        </div>
      )}


      <div
        className="pe-row-cells"
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        onClick={onClick}
        onKeyDown={onKeyDown}
      >
        {row.map((rc, c) => {
          const text = cellText(rc.data);
          const latent = isLatent(rc.data, rc.column.definition.type);
          const cls = ['pe-cell', rc.hasChanged && 'is-changed', latent && 'is-latent']
            .filter(Boolean)
            .join(' ');
          return (
            <div
              key={c}
              className={cls}
              style={{ width: rc.column.width }}
              title={latent ? `Stored value doesn't match this column's type (${rc.column.definition.type})` : undefined}
            >
              {isSelected && edgeDragPreviewHeight > 0 && (
                <CellImage
                  className="pe-context"
                  image={image}
                  x={offsets[c]}
                  y={topEdge - edgeDragPreviewHeight}
                  width={rc.column.width}
                  height={edgeDragPreviewHeight}
                />
              )}
              <CellImage image={image} x={offsets[c]} y={topEdge} width={rc.column.width} height={height} />
              {isSelected && edgeDragPreviewHeight > 0 && (
                <CellImage
                  className="pe-context"
                  image={image}
                  x={offsets[c]}
                  y={topEdge + height}
                  width={rc.column.width}
                  height={edgeDragPreviewHeight}
                />
              )}
              <div className="pe-cell-text">{text || '\u00a0'}</div>
            </div>
          );
        })}
      </div>

    </div>
  );
}