// Finish this react typescript Code.

// Note that this is for a data entry editor, where all users are correcting OCR scans of a table that should have the same shape (but may be incorrect due to OCR errors). Due to this nature, we treat edges and data entirely separately, and don't attempt to manage columns (the available columns are well known and should be in the same order in all images). Similarly, we don't rearrange data on edge insertions / deletions, as they're not actually adding or deleting columns, but they are rearranging where those columns were detected. It is notable that having data move on column insert is desirable, but it needs to be explainable in terms of column shifts, and it might not be desirable in all scenarios.

// Local clients will remember history, but only ever serialize the full document. The proposed code allows for some kinds of merges, but not others.


// import { Timestamp } from "firebase/firestore";
// import type { DateValue, Page } from "./page";
// import type { Dispatch } from "react";

// export interface UpdateCellValueAction {
//   action: 'update-cell-raw';
//   row: number;
//   col: number;
//   raw: DateValue | string | null;
//   on: Timestamp;
//   by: string;
// }
// export interface InsertEdgeAction {
//   action: 'insert-edge'
//   axis: 'x' | 'y'
//   val: number;
//   on: Timestamp;
//   by: string;
// }
// export interface RemoveEdgeAction {
//   action: 'remove-edge'
//   axis: 'x' | 'y'
//   idx: number;
//   on: Timestamp;
//   by: string;
// }
// export interface MoveEdgeAction {
//   action: 'move-edge'
//   axis: 'x' | 'y'
//   idx: number;
//   val: number;
//   on: Timestamp;
//   by: string;
// }
// export type PageAction = InsertEdgeAction | MoveEdgeAction | RemoveEdgeAction | UpdateCellValueAction
// export const EdgeSort = (a : number, b : number) => a - b
// export interface VirtualPageUndo {
//   action: 'vpage-undo';
//   count: number;
// }
// export interface VirtualPageRedo {
//   action: 'vpage-redo';
//   count: number;
// }
// export interface VirtualPageSelectStart {
//   action: 'vpage-select';
//   idx: number;
//   started: Timestamp;
// }
// export interface VirtualPageSelectEnd {
//   action: 'vpage-select-end';
//   sync_errors: SyncError[];
//   new_page: Page | null;
// }
// export interface VirtualPageRebaseStart {
//   action: 'vpage-rebase';
//   id: string;
//   started: Timestamp;
// }
// export interface VirtualPageRebaseEnd {
//   action: 'vpage-rebase-end';
//   id: string;
//   sync_errors: SyncError[];
//   new_base: Page | null;
// }
// export interface VirtualPageApply {
//   action: 'vpage-apply';
//   inner: PageAction;
// }
// export interface VirtualPageCancel {
//   action: 'vpage-cancel';
// }
// export interface VirtualPageSaveStart {
//   action: 'vpage-save';
//   id: string;
//   started: Timestamp;
// }
// export interface VirtualPageSaveEnd {
//   action: 'vpage-save-end';
//   id: string;
//   sync_errors: SyncError[];
//   new_base: Page | null;
// }
// export interface SyncError {
//   at: Timestamp;
//   style: string
//   for_page: number;
//   msg: string;
// }
// export type VirtualPageAction = VirtualPageUndo | VirtualPageRedo | VirtualPageRebaseStart | VirtualPageRebaseEnd | VirtualPageApply | VirtualPageCancel | VirtualPageSaveStart | VirtualPageSaveEnd | VirtualPageSelectStart | VirtualPageSelectEnd
// export interface VirtualPageState {
//   source: Page;
//   actions: PageAction[];
//   render_index: number;
//   render: Page;
//   sync_errors: SyncError[];
//   pending_action: null | VirtualPageRebaseStart | VirtualPageSaveStart | VirtualPageSelectStart;
// }

// export type TrySavePage = (last_seen: Timestamp, page: Page) => Promise<boolean>;
// export type FetchPage = (idx: number) => Promise<Page>;
// export interface PageApi {
//   try_save : TrySavePage;
//   fetch : FetchPage;
// }
// export type ThunkAction<S, A, R = void> = (
//   dispatch: Dispatch<A>,
//   getState: () => S
// ) => R;
// export interface ThunkDispatch<S, A> {
//   <R>(thunk: ThunkAction<S, A, R>): R;
//   (action: A): void;
// }
// export interface VirtualPage {
//   state: VirtualPageState;
//   save: () => Promise<void>;
//   rebase: () => Promise<void>;
//   select: (idx: number) => Promise<void>;
//   apply: (page_action : PageAction) => void;
//   undo: (count : number) => void;
//   redo: (count : number) => void;
//   cancel: () => void;
// }
// export function useVirtualPage(startingIdx : number, api : PageApi) : VirtualPage {

// }

// // export class VirtualPage {
// //   source_page: Page;
// //   private try_save: TrySavePage;
// //   private fetch: FetchPage;
// //   private actions: PageAction[];
// //   private render_idx: number;
// //   private render: Page;
// //   constructor(
// //     source_page : Page,
// //     try_save : TrySavePage,
// //     fetch : FetchPage,
// //   ) {
// //     this.source_page = source_page;
// //     this.try_save = try_save;
// //     this.fetch = fetch;
// //     this.actions = [];
// //     this.render_idx = 0;
// //     this.render = source_page;
// //   }

// //   apply(action : PageAction) : Page {
// //     this.actions = [ ...this.actions.slice(0, this.render_idx), action ]
// //     return this.redo(1)
// //   }

// //   undo(count : number = 1) : Page {
// //     if (this.render_idx <= 0) {
// //       return this.render
// //     }
// //     this.render_idx -= Math.min(count, this.render_idx)
// //     this.render = this.actions.slice(0, this.render_idx).reduce(apply_page_action, this.source_page)
// //     return this.render
// //   }
// //   redo(count : number = 1) {
// //     if (this.render_idx >= this.actions.length) {
// //       return this.render
// //     }
// //     const before_render = this.render_idx
// //     this.render_idx += Math.min(count, this.actions.length - this.render_idx)
// //     this.render = this.actions.slice(before_render, this.render_idx).reduce(apply_page_action, this.render)
// //     return this.render
// //   }
// //   rebase(page : Page) : [Page | null, string | null, boolean] {
// //     if (page.updated.toMillis() <= this.source_page.updated.toMillis()) {
// //       // nothing to do, up-to-date
// //       return [this.render, null, false]
// //     } else {
// //       const contributors = Object.entries(page.contributors ?? {}).filter(([_,v]) => v > this.source_page.updated ).map(([k,_]) => k).join(',') || 'unknown'
// //       if (
// //         this.source_page.edges.x.length != page.edges.x.length
// //         || this.source_page.edges.y.length != page.edges.y.length
// //       ) {
// //         // critical error, not the same shape, don't try to merge
// //         return [null, `Update from ${contributors} has a unrecoverable conflict, please cancel and try to make your changes again (sorry!)`, false]
// //       }
// //       const target_idx = this.render_idx
// //       this.source_page = page
// //       this.render = page
// //       this.render_idx = 0
// //       return [this.redo(target_idx), `Update from ${contributors} were silently merged, ensure that your updates still apply before saving or cancel your changes.`, true]
// //     }
// //   }
// //   clear(): void {
// //     this.actions = [];
// //     this.render_idx = 0;
// //     this.render = this.source_page;
// //   }
// //   async save() : Promise<[Page | null, string[]]> {
// //     const msgs : string[] = []
// //     let tries_remaining = 3
// //     while (!await this.try_save(this.source_page.updated, this.render)) {
// //       if (--tries_remaining < 0) {
// //         msgs.push('Too many conflicts, aborting merge, cancel and try again...')
// //         return [null, msgs]
// //       }
// //       const incoming = await this.fetch(this.source_page.idx)
// //       const [next_render, msg, did_rebase] = this.rebase(incoming)
// //       if (msg != null) {
// //         msgs.push(msg)
// //       }
// //       if (next_render == null) {
// //         return [null, msgs]
// //       }
// //       if (did_rebase) {
// //         msgs.push(`Aborting save, there may be new changes to review... Save again if you're sure`)
// //         return [next_render, msgs]
// //       }
// //     }
// //     const next_page = await this.fetch(this.source_page.idx);
// //     // Compares client provided timestamps. Note, it's
// //     if (next_page.updated.toMillis() < this.render.updated.toMillis()) {
// //       msgs.push('Failed to fetch correctly updated source after save. Try saving again?')
// //       return [this.render, msgs]
// //     } else {
// //       this.source_page = next_page
// //       this.clear()
// //     }
// //     return [this.render, msgs]
// //   }
// // }

// // export function apply_page_action(page : Page, action : PageAction): Page {
// //   // Clamp to make sure we never allow rendered pages to misreport updated timestamps
// //   // even if we have history that extends from before the page was last updated
// //   const updated = page.updated.toMillis() > action.on.toMillis() ? page.updated : action.on
// //   switch (action.action) {

// //     case 'update-cell-raw': {
// //       const cells = [...(page.cells ?? [])]
// //       cells[action.row] = [...(cells[action.row] ?? [])]
// //       if (null === action.raw) {
// //         cells[action.row][action.col] = null
// //       } else {
// //         cells[action.row][action.col] = { u: action.on, v: action.raw }
// //       }
// //       return { ...page, cells, updated, contributors: { ...page.contributors, [action.by]: action.on } }
// //     }
// //     case 'insert-edge': {
// //       return {
// //         ...page,
// //         edges: {
// //           ...page.edges,
// //           [action.axis]: [...page.edges[action.axis], action.val].sort(EdgeSort),
// //         },
// //         updated,
// //         contributors: { ...page.contributors, [action.by]: action.on }
// //       }
// //     }
// //     case 'move-edge': {
// //       const axis = [...page.edges[action.axis]]
// //       axis[action.idx] = action.val
// //       return {
// //         ...page,
// //         edges: {
// //           ...page.edges,
// //           [action.axis]: axis.sort(EdgeSort)
// //         },
// //         updated,
// //         contributors: { ...page.contributors, [action.by]: action.on }
// //       }
// //     }
// //     case 'remove-edge': {
// //       const before = [...page.edges[action.axis].slice(0, action.idx)]
// //       const after = [...page.edges[action.axis].slice(action.idx + 1)]
// //       return {
// //         ...page,
// //         edges: {
// //           ...page.edges,
// //           [action.axis]: [...before, ...after]
// //         },
// //         updated,
// //         contributors: { ...page.contributors, [action.by]: action.on }
// //       }
// //     }
// //   }
// // }