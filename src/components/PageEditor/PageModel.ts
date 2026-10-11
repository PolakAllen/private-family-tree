import type { Cell, ColumnDef, Edges, Page, Column, RowCell } from './types';

/** Used when edge errors leave a page with more columns than there are definitions. */
const fallbackDefinition = (i: number): ColumnDef => ({
  id: `unassigned-${i}`,
  label: `Column ${i + 1}`,
  type: 'name',
});

export function buildColumns(edges: Edges, defs: ColumnDef[]): Column[] {
  const n = Math.max(0, edges.x.length - 1);
  return Array.from({ length: n }, (_, i) => ({
    width: edges.x[i + 1] - edges.x[i],
    definition: defs[i] ?? fallbackDefinition(i),
  }));
}

export const rowHeights = (edges: Edges): number[] =>
  Array.from({ length: Math.max(0, edges.y.length - 1) }, (_, r) => edges.y[r + 1] - edges.y[r]);

/** Compares values only; the timestamp is ignored so reverting an edit clears the flag. */
export function cellsEqual(a: Cell | undefined, b: Cell | undefined): boolean {
  if (!a || !b) return !a && !b;
  return a === b || JSON.stringify(a.v) === JSON.stringify(b.v);
}

/** [row][col] grid of RowCells; irregular `cells` arrays are padded with nulls. */
export function buildRows(source: Page, render: Page, columns: Column[]): RowCell[][] {
  const rowCount = Math.max(0, render.edges.y.length - 1);
  return Array.from({ length: rowCount }, (_, r) =>
    columns.map((column, c) => {
      const data = render.cells[r]?.[c] ?? null;
      const original = source.cells[r]?.[c] ?? null;
      return { data, column, hasChanged: !cellsEqual(original, data) };
    }),
  );
}