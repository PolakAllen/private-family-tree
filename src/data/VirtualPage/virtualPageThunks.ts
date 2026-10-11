import { Timestamp } from "firebase/firestore";
import type { Page } from "../page";
import type { PageApi, SyncError, VirtualPageRebaseStart, VirtualPageSaveStart, VirtualPageSelectStart, VirtualPageState, VThunk } from "./types";
import { errMsg, newId, syncError } from "./utils";

interface SaveOutcome { ok: boolean; new_base: Page | null; errors: SyncError[]; }

async function attemptSave(api: PageApi, s: VirtualPageState, refetch: boolean): Promise<SaveOutcome> {
  const idx = s.source.idx;
  let saved: boolean;
  try {
    saved = await api.try_save(s.source.updated, s.render);
  } catch (e) {
    return { ok: false, new_base: null, errors: [syncError('network', idx, `Save failed: ${errMsg(e)}`)] };
  }
  if (!saved) {
    return { ok: false, new_base: null, errors: [syncError('conflict', idx,
      'This page was changed by someone else since you loaded it. Rebase to merge your edits.')] };
  }
  if (!refetch) return { ok: true, new_base: null, errors: [] };
  try {
    // try_save only reports success, so fetch to learn the server's new `updated` key.
    return { ok: true, new_base: await api.fetch(idx), errors: [] };
  } catch (e) {
    return { ok: true, new_base: null, errors: [syncError('network', idx,
      `Saved, but reloading the page failed (${errMsg(e)}). Rebase to continue.`)] };
  }
}

export const saveThunk = (api: PageApi): VThunk<Promise<void>> => async (dispatch, getState) => {
  const s = getState();
  if (s.pending_action || s.render_index === 0) return;
  const start: VirtualPageSaveStart = {
    action: 'vpage-save', id: newId(), started: Timestamp.now(), snapshot_count: s.render_index,
  };
  dispatch(start);
  const r = await attemptSave(api, s, true);
  if (getState().pending_action !== start) return; // cancelled
  dispatch({ action: 'vpage-save-end', id: start.id, sync_errors: r.errors, new_base: r.new_base });
};

export const rebaseThunk = (api: PageApi): VThunk<Promise<void>> => async (dispatch, getState) => {
  const s = getState();
  if (s.pending_action || s.source.image === '') return;
  const start: VirtualPageRebaseStart = {
    action: 'vpage-rebase', id: newId(), started: Timestamp.now(), snapshot_count: s.actions.length,
  };
  dispatch(start);
  let fresh: Page | null = null;
  const errors: SyncError[] = [];
  try {
    const p = await api.fetch(s.source.idx);
    if (!p.updated.isEqual(s.source.updated)) fresh = p; // else: nothing to merge
  } catch (e) {
    errors.push(syncError('network', s.source.idx, `Rebase failed: ${errMsg(e)}`));
  }
  if (getState().pending_action !== start) return;
  dispatch({ action: 'vpage-rebase-end', id: start.id, sync_errors: errors, new_base: fresh });
};

/**
 * Saves the current page if dirty (aborting the switch if that fails),
 * then loads `idx`. With `adopt`, uses the pending select already in state
 * (initial load).
 */
export const selectThunk = (api: PageApi, idx: number, adopt = false): VThunk<Promise<void>> =>
  async (dispatch, getState) => {
    const s = getState();
    let start: VirtualPageSelectStart;
    if (adopt) {
      if (s.pending_action?.action !== 'vpage-select') return;
      start = s.pending_action;
    } else {
      if (s.pending_action) return;
      start = { action: 'vpage-select', idx, started: Timestamp.now() };
      dispatch(start);
    }
    const end = (sync_errors: SyncError[], new_page: Page | null) => {
      if (getState().pending_action !== start) return; // cancelled
      dispatch({ action: 'vpage-select-end', sync_errors, new_page });
    };

    if (!adopt && s.render_index > 0) {
      const r = await attemptSave(api, s, false);
      if (!r.ok) return end(r.errors, null);
      if (getState().pending_action !== start) return;
    }
    try {
      const page = await api.fetch(idx);
      end([], page.idx === idx ? page : null);
    } catch (e) {
      end([syncError('network', idx, `Could not load page ${idx}: ${errMsg(e)}`)], null);
    }
  };