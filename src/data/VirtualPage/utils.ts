import { Timestamp } from "firebase/firestore";
import type { Cell, Page, Updated } from "../page";
import type { EdgeAction, PageAction, SyncError, UpdateCellValueAction } from "./types";

export const EdgeSort = (a : number, b : number) => a - b

const MAX_INDEX = 10_000; // sanity cap against runaway array growth

export const isIndex = (n: unknown): n is number =>
  typeof n === 'number' && Number.isInteger(n) && n >= 0 && n < MAX_INDEX;


/** Isolated so it's a one-line fix if `Updated` has a different shape. */
export const stamp = (on: Timestamp, by: string): Updated => ({ on, by }) as unknown as Updated;

export function valueEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (a instanceof Timestamp && b instanceof Timestamp) return a.isEqual(b);
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every(k =>
    valueEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
}

export function emptyPage(idx: number): Page {
  const zero = Timestamp.fromMillis(0);
  return {
    idx, updated: zero, image: '',
    edges: { x: [], y: [], updated: stamp(zero, '') },
    cells: [],
  };
}

export const numsEqual = (a: number[], b: number[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

export const cellAt = (page: Page, row: number, col: number): Cell =>
  page.cells[row]?.[col] ?? null;

/** '' is normalised to null (an empty cell). */
export const normRaw = (raw: UpdateCellValueAction['raw']) => (raw === '' ? null : raw);

export const cellMatchesRaw = (cell: Cell, raw: UpdateCellValueAction['raw']): boolean => {
  const r = normRaw(raw);
  return r === null ? cell === null : cell !== null && valueEqual(cell.v, r);
};

export const isEdgeAction = (a: PageAction): a is EdgeAction => a.action !== 'update-cell-raw';

let opCounter = 0;
export const newId = (): string =>
  globalThis.crypto?.randomUUID?.() ?? `op-${Date.now()}-${++opCounter}`;

export const errMsg = (e: unknown): string => (e instanceof Error ? e.message : String(e));

export const syncError = (style: string, for_page: number, msg: string): SyncError =>
  ({ at: Timestamp.now(), style, for_page, msg });