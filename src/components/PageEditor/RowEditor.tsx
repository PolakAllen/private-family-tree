import { useEffect, useId, useState } from 'react';
import type { CellType, DateValue, RowCell } from './types';
import { CellImage } from './CellImage';
import { cellText, isDateValue } from './cellValue';
import DateEditor from '../DateEditor';

const MIN_FIELD_WIDTH = 96;
// Typed so TS checks the cell types we support.
const INPUT_CLASS: Record<Exclude<CellType, 'date'>, string> = {
  gen: 'pe-input pe-input-gen',
  name: 'pe-input',
  id: 'pe-input pe-input-id',
};

export interface RowEditorProps {
  image: string;
  /** y (image px) of the selected row's top edge, i.e. edges.y[selectedRow]. */
  topEdge: number;
  leftEdge: number;
  row: RowCell[];
  update: (col: number, val: DateValue | string | null) => void;
  /** Height (image px) of each scan crop above its field. Pass the row height for an exact match. */
  cropHeight?: number;
}

/**
 * Text is committed on blur/Enter (not per keystroke) so each correction is a
 * single undo step.
 */
function TextField({
  id, value, className, onCommit,
}: { id: string; value: string; className: string; onCommit: (v: string | null) => void }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  const commit = () => {
    if (draft !== value) onCommit(draft === '' ? null : draft);
  };

  return (
    <input
      id={id}
      className={className}
      value={draft}
      spellCheck={false}
      autoComplete="off"
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
        if (e.key === 'Escape') setDraft(value);
      }}
    />
  );
}

export default function RowEditor({ image, topEdge, leftEdge, row, update, cropHeight = 48 }: RowEditorProps) {
  const baseId = useId();
  let x = leftEdge;
  const offsets = row.map((rc) => {
    const o = x;
    x += rc.column.width;
    return o;
  });

  return (
    <div className="pe-editor" role="group" aria-label="Edit selected row">
      {row.map((rc, c) => {
        const { type, label } = rc.column.definition;
        const id = `${baseId}-${c}`;
        const stored = rc.data?.v;
        const width = Math.max(rc.column.width, MIN_FIELD_WIDTH);

        let field;
        let note: string | null = null;

        if (type === 'date') {
          field = (
            <DateEditor
              value={stored !== undefined && isDateValue(stored) ? stored : null}
              onChange={(d: DateValue | null) => update(c, d)}
            />
          );
          if (stored !== undefined && !isDateValue(stored) && stored !== '') {
            note = `Stored as text: "${stored}"`;
          }
        } else {
          field = (
            <TextField
              id={id}
              className={INPUT_CLASS[type]}
              value={typeof stored === 'string' ? stored : ''}
              onCommit={(v) => update(c, v)}
            />
          );
          if (stored !== undefined && isDateValue(stored)) {
            note = `Stored as date: ${cellText(rc.data)}`;
          }
        }

        return (
          <div key={c} className={`pe-field${rc.hasChanged ? ' is-changed' : ''}`} style={{ width }}>
            <label className="pe-field-label" htmlFor={type === 'date' ? undefined : id}>{label}</label>
            <CellImage
              image={image}
              x={offsets[c]}
              y={topEdge}
              width={rc.column.width}
              height={cropHeight}
              label={`Scan of ${label}`}
            />
            {field}
            {note && <div className="pe-field-note">{note}</div>}
          </div>
        );
      })}
    </div>
  );
}