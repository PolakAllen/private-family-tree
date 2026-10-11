import { formatDateValue } from '../DateEditor';
import type { Cell, CellType, DateValue } from './types';

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