import type { Cell, Page } from "../page";
import type { EdgeAction, PageAction } from "./types";
import { cellAt, EdgeSort, isIndex, normRaw, stamp, valueEqual } from "./utils";

/**
 * Applies one action. Returns the SAME page reference if the action is invalid
 * or a no-op (callers use this to avoid empty history entries).
 * Edges and cells are intentionally independent: edge edits never move data.
 */
export function applyPageAction(page: Page, a: PageAction): Page {
  switch (a.action) {
    case 'update-cell-raw': {
      if (!isIndex(a.row) || !isIndex(a.col)) return page;
      const raw = normRaw(a.raw);
      const old = cellAt(page, a.row, a.col);
      if (raw === null ? old === null : old !== null && valueEqual(old.v, raw)) return page;
      const next: Cell = raw === null ? null : { v: raw, u: a.on };
      const rows = page.cells.slice();
      while (rows.length <= a.row) rows.push([]);
      const r = (rows[a.row] ?? []).slice();
      while (r.length <= a.col) r.push(null);
      r[a.col] = next;
      rows[a.row] = r;
      return { ...page, cells: rows, contributors: touch(page.contributors, a) };
    }
    case 'insert-edge': {
      const cur = page.edges[a.axis];
      if (!Number.isFinite(a.val) || cur.includes(a.val)) return page;
      const insertIndex = Math.max(cur.findIndex(i => i > a.val), 0);
      const cells = [...page.cells.slice(0, insertIndex), [], ...page.cells.slice(insertIndex)]
      const axisEdges = [...cur, a.val].sort(EdgeSort)
      return {
        ...page,
        cells,
        edges: { ...page.edges, [a.axis]: axisEdges, updated: stamp(a.on, a.by) },
        contributors: touch(page.contributors, a),
      }
    }
    case 'remove-edge': {
      const cur = page.edges[a.axis];
      if (!isIndex(a.idx) || a.idx >= cur.length || cur.length <= 2) return page;
      const cells = [...page.cells.slice(0, a.idx), ...page.cells.slice(a.idx + 1)]
      const axisEdges = cur.filter((_, i) => i !== a.idx);
      return {
        ...page,
        cells,
        edges: { ...page.edges, [a.axis]: axisEdges, updated: stamp(a.on, a.by) },
        contributors: touch(page.contributors, a),
      }
    }
    case 'move-edge': {
      const cur = page.edges[a.axis];
      if (!isIndex(a.idx) || a.idx >= cur.length || !Number.isFinite(a.val)) return page;
      if (cur[a.idx] === a.val) return page;
      if (cur.includes(a.val)) return page; // would create a duplicate edge
      const next = cur.slice();
      next[a.idx] = a.val;
      return withEdges(page, a, next.sort(EdgeSort));
    }
  }
}

const touch = (c: Page['contributors'], a: PageAction): Page['contributors'] =>
  ({ ...(c ?? {}), [a.by]: a.on });

function withEdges(page: Page, a: EdgeAction, arr: number[]): Page {
  return {
    ...page,
    edges: { ...page.edges, [a.axis]: arr, updated: stamp(a.on, a.by) },
    contributors: touch(page.contributors, a),
  };
}
