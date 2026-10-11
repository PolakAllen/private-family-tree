import type { Timestamp } from "firebase/firestore";



export interface YearValue {
  t: 'century' | 'decade' | 'year'
  y: number;
  n?: string; // note
}
export interface MonthValue {
  t: 'month';
  y: number;
  m: number;
  n?: string; // note
}
export interface DayValue {
  t: 'day';
  y: number;
  m: number;
  d: number;
  n?: string; // note
}
export type DateValue = YearValue | MonthValue | DayValue

export interface Updated {
  on: Timestamp;
  by: string; 
}
export type CellType = 'gen' | 'name' | 'id' | 'date';
export interface ColumnDef {
  id: string;
  label: string;
  type: CellType;
}
export type Cell = { v: string | DateValue, u?: Timestamp } | null

export interface Edges {
  y: number[]; // N+1 ascending y positions for N rows
  x: number[]; // M+1 ascending x positions for M columns, should be 22 for all pages
  updated: Updated;
}

export interface Page {
  idx: number;
  updated: Timestamp; // timestamp also serves as merge / optimistic lock key
  image: string;
  edges: Edges;
  cells: Cell[][]; // [row][col], N x M, may have irregular shape, filled with nulls/undefined
  contributors ?: { [email: string]: Timestamp }
}