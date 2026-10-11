import { useEffect, useRef, useState } from 'react';
import './component.css';
import type { DateValue } from '../../data/page';

export type Precision = DateValue['t'];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const PRECISIONS: { value: Precision; label: string }[] = [
  { value: 'century', label: 'Century' },
  { value: 'decade', label: 'Decade' },
  { value: 'year', label: 'Year' },
  { value: 'month', label: 'Month' },
  { value: 'day', label: 'Day' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

export function daysInMonth(y: number | null, m: number): number {
  if (m === 2) return isLeap(y ?? 2000) ? 29 : 28;
  return [4, 6, 9, 11].includes(m) ? 30 : 31;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Snap a year to the start of its century/decade (1987 -> 1900 / 1980). */
function snapYear(t: Precision, y: number): number {
  if (t === 'century') return Math.floor(y / 100) * 100;
  if (t === 'decade') return Math.floor(y / 10) * 10;
  return y;
}

function ordinal(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  return `${n}${({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'}`;
}

/**
 * Human-readable rendering. Convention: a century's `y` is the first year of
 * the "XX00s" span, so y=1800 -> "19th century".
 */
export function formatDateValue(v: DateValue): string {
  let base: string;
  switch (v.t) {
    case 'century':
      base = v.y >= 0 ? `${ordinal(Math.floor(v.y / 100) + 1)} century` : `${v.y}s`;
      break;
    case 'decade':
      base = `${v.y}s`;
      break;
    case 'year':
      base = String(v.y);
      break;
    case 'month':
      base = `${MONTHS[v.m - 1]} ${v.y}`;
      break;
    case 'day':
      base = `${MONTHS[v.m - 1]} ${v.d}, ${v.y}`;
      break;
  }
  return v.n ? `${base} (${v.n})` : base;
}

/* ------------------------------------------------------------------ */
/* Internal draft model                                                */
/*                                                                     */
/* The draft keeps fields that the current precision doesn't use, so   */
/* switching Day -> Year -> Day doesn't lose the month/day. It also    */
/* holds the raw (un-snapped) year while the user is typing.           */
/* ------------------------------------------------------------------ */

interface Draft {
  t: Precision;
  y: number | null;
  m: number;
  d: number;
  n: string;
}

function toDraft(v: DateValue | null): Draft {
  if (!v) return { t: 'year', y: null, m: 1, d: 1, n: '' };
  return {
    t: v.t,
    y: v.y,
    m: 'm' in v ? v.m : 1,
    d: 'd' in v ? v.d : 1,
    n: v.n ?? '',
  };
}

function toValue(dr: Draft): DateValue | null {
  if (dr.y === null) return null;
  const y = snapYear(dr.t, dr.y);
  const n = dr.n.trim() ? { n: dr.n } : {};
  switch (dr.t) {
    case 'century':
    case 'decade':
    case 'year':
      return { t: dr.t, y, ...n };
    case 'month':
      return { t: 'month', y, m: clamp(dr.m, 1, 12), ...n };
    case 'day': {
      const m = clamp(dr.m, 1, 12);
      return { t: 'day', y, m, d: clamp(dr.d, 1, daysInMonth(y, m)), ...n };
    }
  }
}

function sameValue(a: DateValue | null, b: DateValue | null): boolean {
  if (!a || !b) return a === b;
  const f = (v: DateValue) => [v.t, v.y, 'm' in v ? v.m : 0, 'd' in v ? v.d : 0, v.n ?? ''].join('|');
  return f(a) === f(b);
}

/* ------------------------------------------------------------------ */
/* Integer field: keeps its own text so "-" or "" can be typed         */
/* ------------------------------------------------------------------ */

interface IntFieldProps {
  value: number | null;
  onChange: (n: number | null) => void;
  onCommit?: () => void;
  allowNegative?: boolean;
  maxLength?: number;
  className?: string;
  placeholder?: string;
  label: string;
  disabled?: boolean;
}

function IntField({
  value, onChange, onCommit, allowNegative, maxLength = 6, className, placeholder, label, disabled,
}: IntFieldProps) {
  const [text, setText] = useState(value === null ? '' : String(value));
  const focused = useRef(false);

  // Follow external changes (e.g. day clamped, year snapped) when not typing.
  useEffect(() => {
    if (!focused.current) setText(value === null ? '' : String(value));
  }, [value]);

  const pattern = allowNegative ? /^-?\d*$/ : /^\d*$/;

  return (
    <input
      className={`de-input ${className ?? ''}`}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      aria-label={label}
      placeholder={placeholder}
      maxLength={maxLength}
      disabled={disabled}
      value={text}
      onFocus={(e) => {
        focused.current = true;
        e.currentTarget.select();
      }}
      onChange={(e) => {
        const next = e.target.value;
        if (!pattern.test(next)) return;
        setText(next);
        if (next === '') onChange(null);
        else if (/^-?\d+$/.test(next)) onChange(parseInt(next, 10));
      }}
      onBlur={() => {
        focused.current = false;
        onCommit?.();
        setText(value === null ? '' : String(value));
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onCommit?.();
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export interface DateEditorProps {
  value: DateValue | null;
  onChange: (value: DateValue | null) => void;
  /** Show the formatted result beneath the controls. */
  showPreview?: boolean;
  disabled?: boolean;
  className?: string;
  /** Accessible name prefix, e.g. "Birth date". */
  label?: string;
}

export function DateEditor({
  value, onChange, showPreview = false, disabled, className, label = 'Date',
}: DateEditorProps) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(value));
  const [noteOpen, setNoteOpen] = useState<boolean>(() => !!value?.n);
  const lastEmitted = useRef<DateValue | null>(value);

  // Adopt external changes, but not echoes of what we just emitted.
  useEffect(() => {
    if (!sameValue(value, lastEmitted.current)) {
      lastEmitted.current = value;
      setDraft(toDraft(value));
      if (value?.n) setNoteOpen(true);
    }
  }, [value]);

  const update = (patch: Partial<Draft>, snapDraft = false) => {
    const next: Draft = { ...draft, ...patch };
    if (snapDraft && next.y !== null) next.y = snapYear(next.t, next.y);
    // Keep day valid for the (possibly new) month/year.
    next.d = clamp(next.d, 1, daysInMonth(next.y === null ? null : snapYear(next.t, next.y), next.m));
    const out = toValue(next);
    setDraft(next);
    lastEmitted.current = out;
    onChange(out);
  };

  const { t } = draft;
  const showMonth = t === 'month' || t === 'day';
  const showDay = t === 'day';
  const hasValue = draft.y !== null;
  const current = toValue(draft);
  const spanSuffix = t === 'century' || t === 'decade' ? 's' : null;

  return (
    <div className={`de-root ${className ?? ''}`} role="group" aria-label={label}>
      <div className="de-row">
        <select
          className="de-input de-precision"
          aria-label={`${label} precision`}
          disabled={disabled}
          value={t}
          onChange={(e) => update({ t: e.target.value as Precision }, true)}
        >
          {PRECISIONS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>

        <span className="de-year-wrap">
          <IntField
            className="de-year"
            label={`${label} year`}
            placeholder={t === 'century' ? '1900' : t === 'decade' ? '1990' : 'Year'}
            value={draft.y}
            allowNegative
            disabled={disabled}
            onChange={(y) => update({ y })}
            onCommit={() => {
              if (spanSuffix) update({}, true);
            }}
          />
          {spanSuffix && <span className="de-suffix" aria-hidden="true">{spanSuffix}</span>}
        </span>

        {showMonth && (
          <select
            className="de-input de-month"
            aria-label={`${label} month`}
            disabled={disabled || !hasValue}
            value={draft.m}
            onChange={(e) => update({ m: parseInt(e.target.value, 10) })}
          >
            {MONTHS.map((name, i) => (
              <option key={name} value={i + 1}>{name}</option>
            ))}
          </select>
        )}

        {showDay && (
          <IntField
            className="de-day"
            label={`${label} day`}
            placeholder="Day"
            maxLength={2}
            value={draft.d}
            disabled={disabled || !hasValue}
            onChange={(d) => {
              if (d === null) return;
              update({ d: clamp(d, 1, daysInMonth(draft.y, draft.m)) });
            }}
          />
        )}

        {!noteOpen && (
          <button
            type="button"
            className="de-note-toggle"
            disabled={disabled}
            onClick={() => setNoteOpen(true)}
          >
            + Note
          </button>
        )}
      </div>

      {noteOpen && (
        <input
          className="de-input de-note"
          type="text"
          aria-label={`${label} note`}
          placeholder="Note, ex: 'baptism'"
          disabled={disabled}
          autoFocus={!draft.n}
          value={draft.n}
          onChange={(e) => update({ n: e.target.value })}
          onBlur={() => {
            if (!draft.n.trim()) setNoteOpen(false);
          }}
        />
      )}

      {showPreview && (
        <div className="de-preview" aria-live="polite">
          {current ? formatDateValue(current) : 'No date'}
        </div>
      )}
    </div>
  );
}

export default DateEditor;