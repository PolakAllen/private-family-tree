import type { Cell, ColumnDef, DateValue } from '../../data/page';
export * from '../../data/page';
export * from '../../data/VirtualPage/types';

/** A column as the display components see it. `width` is in image px (x-edge distance). */
export interface Column {
  width: number;
  definition: ColumnDef;
}

export interface RowCell {
  data: Cell;
  column: Column;
  /** source.cells[r][c] differs from render.cells[r][c] */
  hasChanged: boolean;
}

export interface HeaderDisplayProps {
  columns: Column[];
  /** Index of the column the split/delete/move actions apply to (null = none). */
  selected: number | null;
  select: (index: number) => void;
  splitColumn: () => void;
  deleteColumn: () => void;
  moveEdge: (edge: 'left' | 'right', delta: number) => void;
}

export interface RowDisplayProps {
  /** Row height in image px (y-edge distance). */
  height: number;
  row: RowCell[];
  /** px */
  edgeDragPreviewHeight: number;
  isSelected: boolean;
  select: () => void;
  splitRow: () => void;
  deleteRow: () => void;
  moveEdge: (edge: 'top' | 'bottom', delta: number) => void;
}

export interface RowEditorProps {
  row: RowCell[];
  update: (col: number, val: DateValue | string | null) => void;
}