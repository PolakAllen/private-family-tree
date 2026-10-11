import { Timestamp } from "firebase/firestore";
import type { DateValue, Page } from "../page";
import type { ThunkAction } from "../../useThunkReducer";

export interface VirtualPage {
  state: VirtualPageState;
  save: () => Promise<void>;
  rebase: () => Promise<void>;
  select: (idx: number) => Promise<void>;
  apply: (page_action : PageAction) => void;
  undo: (count : number) => void;
  redo: (count : number) => void;
  cancel: () => void;
}
export interface SyncError {
  at: Timestamp;
  style: 'conflict' | 'network' | 'merge' | string;
  /**
   * style: 'conflict' (optimistic lock lost), 'network' (api threw),
   *        'merge' (local edits could not be replayed onto a newer base)
   */
  for_page: number;
  msg: string;
}
export interface VirtualPageState {
  source: Page;
  actions: PageAction[];
  render_index: number;
  render: Page;
  sync_errors: SyncError[];
  pending_action: null | VirtualPageRebaseStart | VirtualPageSaveStart | VirtualPageSelectStart;
}
export type TrySavePage = (last_seen: Timestamp, page: Page) => Promise<boolean>;
export type FetchPage = (idx: number) => Promise<Page>;
export interface PageApi {
  try_save : TrySavePage;
  fetch : FetchPage;
}
export interface UpdateCellValueAction {
  action: 'update-cell-raw';
  row: number;
  col: number;
  raw: DateValue | string | null;
  on: Timestamp;
  by: string;
}
export interface InsertEdgeAction {
  action: 'insert-edge'
  axis: 'x' | 'y'
  val: number;
  on: Timestamp;
  by: string;
}
export interface RemoveEdgeAction {
  action: 'remove-edge'
  axis: 'x' | 'y'
  idx: number;
  on: Timestamp;
  by: string;
}
export interface MoveEdgeAction {
  action: 'move-edge'
  axis: 'x' | 'y'
  idx: number;
  val: number;
  on: Timestamp;
  by: string;
}
export type EdgeAction = InsertEdgeAction | MoveEdgeAction | RemoveEdgeAction;
export type PageAction = EdgeAction | UpdateCellValueAction

/* ------------------------------------------------------------------ */
/* Virtual page actions                                                */
/* ------------------------------------------------------------------ */

export type VThunk<R> = ThunkAction<VirtualPageState, VirtualPageAction, R>;
export interface VirtualPageUndo { action: 'vpage-undo'; count: number; }
export interface VirtualPageRedo { action: 'vpage-redo'; count: number; }
export interface VirtualPageSelectStart {
  action: 'vpage-select';
  idx: number;
  started: Timestamp;
}
export interface VirtualPageSelectEnd {
  action: 'vpage-select-end';
  sync_errors: SyncError[];
  new_page: Page | null;
}
export interface VirtualPageRebaseStart {
  action: 'vpage-rebase';
  id: string;
  started: Timestamp;
  /** Number of actions present when the rebase began (informational). */
  snapshot_count: number;
}
export interface VirtualPageRebaseEnd {
  action: 'vpage-rebase-end';
  id: string;
  sync_errors: SyncError[];
  new_base: Page | null;
}
export interface VirtualPageApply { action: 'vpage-apply'; inner: PageAction; }
export interface VirtualPageCancel { action: 'vpage-cancel'; }
export interface VirtualPageSaveStart {
  action: 'vpage-save';
  id: string;
  started: Timestamp;
  /** Number of actions (== render_index) captured in the document being saved. */
  snapshot_count: number;
}
export interface VirtualPageSaveEnd {
  action: 'vpage-save-end';
  id: string;
  sync_errors: SyncError[];
  new_base: Page | null;
}
export type VirtualPageAction = VirtualPageUndo | VirtualPageRedo | VirtualPageRebaseStart | VirtualPageRebaseEnd | VirtualPageApply | VirtualPageCancel | VirtualPageSaveStart | VirtualPageSaveEnd | VirtualPageSelectStart | VirtualPageSelectEnd
