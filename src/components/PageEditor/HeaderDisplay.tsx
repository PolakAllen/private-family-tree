import { useState } from 'react';
import type { MouseEvent } from 'react';
import type { Column } from './types';
import { CellImage } from './CellImage';

const STEP = 2;
const BIG_STEP = 10;
const STRIP_HEIGHT = 40;

export interface HeaderDisplayProps {
  image: string;
  /** y (image px) of the table's top edge. */
  topEdge: number;
  /** x (image px) of the table's left edge. */
  leftEdge: number;
  columns: Column[];
  splitColumn: (col: number) => void;
  deleteColumn: (col: number) => void;
  /** delta is in image px; positive = toward larger x. */
  moveEdge: (edge: 'left' | 'right', col: number, delta: number) => void;
}

export default function HeaderDisplay({
  image, topEdge, leftEdge, columns, splitColumn, deleteColumn, moveEdge,
}: HeaderDisplayProps) {
  const [picked, setPicked] = useState<number | null>(null);
  // Column count changes after split/delete, so never trust a stale index.
  const selected = picked !== null && picked < columns.length ? picked : null;

  const stripHeight = Math.min(STRIP_HEIGHT, Math.max(0, topEdge));
  let x = leftEdge;
  const offsets = columns.map((c) => {
    const o = x;
    x += c.width;
    return o;
  });

  const nudge = (edge: 'left' | 'right', sign: 1 | -1) => (e: MouseEvent) => {
    if (selected !== null) moveEdge(edge, selected, sign * (e.shiftKey ? BIG_STEP : STEP));
  };

  return (
    <div className="pe-header">
      {stripHeight > 0 && (
        <div className="pe-header-strip">
          {columns.map((c, i) => (
            <CellImage
              key={i}
              image={image}
              x={offsets[i]}
              y={topEdge}
              width={c.width}
              height={stripHeight}
            />
          ))}
        </div>
      )}

      <div className="pe-header-labels" role="toolbar" aria-label="Columns">
        {columns.map((c, i) => {
          return (<>
            <button
              key={i}
              type="button"
              className={`pe-col-label${i === selected ? ' is-selected' : ''}`}
              style={{ width: c.width }}
              aria-pressed={i === selected}
              title={`${c.definition.label} (${c.definition.type})`}
              onClick={() => setPicked(i === selected ? null : i)}
            >
              {c.definition.label}
            </button>
          </>)
        })}
      </div>

      {selected !== null && (
        <div className="pe-tools" role="group" aria-label={`Edit column ${columns[selected].definition.label}`}>
          <strong className="pe-tools-title">{columns[selected].definition.label}</strong>
          <button type="button" onClick={() => splitColumn(selected)}>Split column</button>
          <button type="button" onClick={() => deleteColumn(selected)}>Delete column</button>
          <span className="pe-tools-group">
            Left edge
            <button type="button" aria-label="Move left edge left" onClick={nudge('left', -1)}>◀</button>
            <button type="button" aria-label="Move left edge right" onClick={nudge('left', 1)}>▶</button>
          </span>
          <span className="pe-tools-group">
            Right edge
            <button type="button" aria-label="Move right edge left" onClick={nudge('right', -1)}>◀</button>
            <button type="button" aria-label="Move right edge right" onClick={nudge('right', 1)}>▶</button>
          </span>
          <span className="pe-tools-hint">Shift = {BIG_STEP}px steps</span>
        </div>
      )}
    </div>
  );
}