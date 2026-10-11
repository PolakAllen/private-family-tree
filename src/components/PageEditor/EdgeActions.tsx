import type { InsertEdgeAction, MoveEdgeAction, RemoveEdgeAction } from './types';
import { nowTs } from './timestamp';

export type Axis = 'x' | 'y';

/** Smallest allowed row height / column width, in image px. */
export const MIN_CELL_SIZE = 6;

/** Keeps an edge between its neighbours (and >= 0). */
export function clampEdge(edges: number[], idx: number, val: number): number {
  const lo = idx > 0 ? edges[idx - 1] + MIN_CELL_SIZE : 0;
  const hi = idx < edges.length - 1 ? edges[idx + 1] - MIN_CELL_SIZE : Infinity;
  return Math.min(hi, Math.max(lo, Math.round(val)));
}

/** Move edge `idx` by `delta`. Returns null when clamping makes it a no-op. */
export function moveEdgeAction(
  axis: Axis, edges: number[], idx: number, delta: number, by: string,
): MoveEdgeAction | null {
  const current = edges[idx];
  if (current === undefined) return null;
  const val = clampEdge(edges, idx, current + delta);
  if (val === current) return null;
  return { action: 'move-edge', axis, idx, val, on: nowTs(), by };
}

/** Split row/column `cell` in half by inserting an edge at its midpoint. */
export function splitAction(
  axis: Axis, edges: number[], cell: number, by: string,
): InsertEdgeAction | null {
  const start = edges[cell];
  const end = edges[cell + 1];
  if (start === undefined || end === undefined || end - start < 2 * MIN_CELL_SIZE) return null;
  return { action: 'insert-edge', axis, val: Math.round((start + end) / 2), on: nowTs(), by };
}

/**
 * Delete row/column `cell` by merging it into a neighbour: drops its trailing
 * edge, or its leading edge when it is the last one.
 * Change the choice of edge here if "delete" should mean something else.
 */
export function mergeAction(
  axis: Axis, edges: number[], cell: number, by: string,
): RemoveEdgeAction | null {
  const cellCount = edges.length - 1;
  if (cellCount <= 1 || cell < 0 || cell >= cellCount) return null;
  const idx = cell < cellCount - 1 ? cell + 1 : cell;
  return { action: 'remove-edge', axis, idx, on: nowTs(), by };
}