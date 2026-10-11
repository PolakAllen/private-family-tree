import type { Page } from "../page";
import { applyPageAction } from "./pageReducer";
import type { PageAction, SyncError, VirtualPageAction, VirtualPageState } from "./types";
import { cellAt, cellMatchesRaw, numsEqual, syncError, valueEqual } from "./utils";

export default function virtualPageReducer(s: VirtualPageState, a: VirtualPageAction): VirtualPageState {
  const selecting = s.pending_action?.action === 'vpage-select';
  switch (a.action) {
    case 'vpage-apply': {
      if (selecting) return s;
      const render = applyPageAction(s.render, a.inner);
      if (render === s.render) return s;
      const actions = [...s.actions.slice(0, s.render_index), a.inner];
      return { ...s, actions, render_index: actions.length, render };
    }
    case 'vpage-undo': {
      if (selecting) return s;
      // Actions captured by an in-flight save are about to become base state.
      const floor = s.pending_action?.action === 'vpage-save' ? s.pending_action.snapshot_count : 0;
      return moveTo(s, Math.max(floor, s.render_index - Math.max(1, a.count | 0)));
    }
    case 'vpage-redo': {
      if (selecting) return s;
      return moveTo(s, Math.min(s.actions.length, s.render_index + Math.max(1, a.count | 0)));
    }
    case 'vpage-save':
    case 'vpage-rebase':
    case 'vpage-select':
      if (s.pending_action) return s;
      return { ...s, pending_action: a, sync_errors: [] };

    case 'vpage-cancel':
      return freshState(s.source, [])

    case 'vpage-select-end': {
      if (!selecting) return s;
      if (!a.new_page) return { ...s, pending_action: null, sync_errors: a.sync_errors };
      return freshState(a.new_page, a.sync_errors);
    }
    case 'vpage-save-end': {
      const p = s.pending_action;
      if (!p || p.action !== 'vpage-save' || p.id !== a.id) return s;
      if (!a.new_base) return { ...s, pending_action: null, sync_errors: a.sync_errors };
      // What we saved == source + first snapshot_count actions. Anything after it
      // (edits made while saving) is replayed onto the fresh server copy.
      const saved = computeRender(s.source, s.actions, p.snapshot_count);
      const m = mergeActions(
        saved, a.new_base,
        s.actions.slice(p.snapshot_count),
        Math.max(0, s.render_index - p.snapshot_count));
      return rebuilt(a.new_base, m, a.sync_errors);
    }
    case 'vpage-rebase-end': {
      const p = s.pending_action;
      if (!p || p.action !== 'vpage-rebase' || p.id !== a.id) return s;
      if (!a.new_base) return { ...s, pending_action: null, sync_errors: a.sync_errors };
      const m = mergeActions(s.source, a.new_base, s.actions, s.render_index);
      return rebuilt(a.new_base, m, a.sync_errors);
    }
  }
}
function computeRender(source: Page, actions: PageAction[], n: number): Page {
  let p = source;
  for (let i = 0; i < n && i < actions.length; i++) p = applyPageAction(p, actions[i]);
  return p;
}

/* ------------------------------------------------------------------ */
/* Merge: replay local actions onto a newer base                       */
/* ------------------------------------------------------------------ */

interface MergeResult {
  actions: PageAction[];
  render_index: number;
  errors: SyncError[];
}

/**
 * @param before  the page `actions` were originally applied on top of
 * @param base    the newer server page to replay onto
 * @param renderIndex how many of `actions` are currently "applied" (rest is redo tail)
 */
function mergeActions(
  before: Page, base: Page, actions: PageAction[], renderIndex: number
): MergeResult {
  const errors: SyncError[] = [];
  const forPage = base.idx;
  const local = computeRender(before, actions, actions.length);

  const axisState = (axis: 'x' | 'y'): 'clean' | 'converged' | 'diverged' => {
    const n = base.edges[axis];
    if (numsEqual(before.edges[axis], n)) return 'clean';       // nobody else touched it
    if (numsEqual(local.edges[axis], n)) return 'converged';    // already in base
    return 'diverged';
  };
  const axes = { x: axisState('x'), y: axisState('y') };
  const droppedEdges = { x: 0, y: 0 };
  const cellState = new Map<string, 'owned' | 'lost'>();

  let cur = base;
  const kept: PageAction[] = [];
  let keptApplied = 0;

  actions.forEach((act, i) => {
    let keep = false;

    if (act.action === 'update-cell-raw') {
      const key = `${act.row}:${act.col}`;
      const st = cellState.get(key);
      if (st === 'owned') {
        keep = true;
      } else if (st !== 'lost') {
        const was = cellAt(before, act.row, act.col);
        const now = cellAt(base, act.row, act.col);
        if (valueEqual(was, now)) {
          keep = true; cellState.set(key, 'owned');
        } else if (cellMatchesRaw(now, act.raw)) {
          cellState.set(key, 'owned');                  // converged: drop silently
        } else {
          cellState.set(key, 'lost');
          errors.push(syncError('merge', forPage,
            `Cell (row ${act.row + 1}, col ${act.col + 1}) was changed by someone else; your edit was dropped.`));
        }
      }
    } else {
      const st = axes[act.axis];
      if (st === 'clean') keep = true;
      else if (st === 'diverged') {
        if (act.action === 'insert-edge') keep = true;  // value-based, safe to replay
        else droppedEdges[act.axis]++;
      }                                                  // 'converged': drop silently
    }

    if (!keep) return;
    const next = applyPageAction(cur, act);
    if (next === cur) return;                            // no net effect on new base
    cur = next;
    kept.push(act);
    if (i < renderIndex) keptApplied++;
  });

  (['x', 'y'] as const).forEach(axis => {
    if (droppedEdges[axis] > 0) {
      errors.push(syncError('merge', forPage,
        `${droppedEdges[axis]} edge change(s) on the ${axis} axis were dropped because those edges were changed by someone else.`));
    }
  });

  return { actions: kept, render_index: keptApplied, errors };
}

/* ------------------------------------------------------------------ */
/* Reducer                                                             */
/* ------------------------------------------------------------------ */


function freshState(page: Page, sync_errors: SyncError[]): VirtualPageState {
  return { source: page, actions: [], render_index: 0, render: page, sync_errors, pending_action: null };
}

function rebuilt(
  base: Page, m: MergeResult, extraErrors: SyncError[]
): VirtualPageState {
  return {
    source: base,
    actions: m.actions,
    render_index: m.render_index,
    render: computeRender(base, m.actions, m.render_index),
    sync_errors: [...extraErrors, ...m.errors],
    pending_action: null,
  };
}


function moveTo(s: VirtualPageState, to: number): VirtualPageState {
  if (to === s.render_index) return s;
  return { ...s, render_index: to, render: computeRender(s.source, s.actions, to) };
}