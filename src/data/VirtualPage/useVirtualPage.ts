import { useCallback, useEffect, useMemo, useRef } from "react";
import useThunkReducer from "../../useThunkReducer";
import type { PageAction, PageApi, VirtualPage, VirtualPageState } from "./types";
import { emptyPage } from "./utils";
import { Timestamp } from "firebase/firestore";
import virtualPageReducer from "./virtualPageReducer";
import { rebaseThunk, saveThunk, selectThunk } from "./virtualPageThunks";

export default function useVirtualPage(startingIdx : number, api : PageApi) : VirtualPage {
  const [state, dispatch] = useThunkReducer(virtualPageReducer, () => initialState(startingIdx));
  const apiRef = useRef(api);
  apiRef.current = api;

  const booted = useRef(false);
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    void dispatch(selectThunk(apiRef.current, startingIdx, true));
    // startingIdx is intentionally only read on mount; use select() to navigate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = useCallback(() => dispatch(saveThunk(apiRef.current)), [dispatch]);
  const rebase = useCallback(() => dispatch(rebaseThunk(apiRef.current)), [dispatch]);
  const select = useCallback(
    (idx: number) => dispatch(selectThunk(apiRef.current, idx)), [dispatch]);
  const apply = useCallback(
    (inner: PageAction) => dispatch({ action: 'vpage-apply', inner }), [dispatch]);
  const undo = useCallback(
    (count: number) => dispatch({ action: 'vpage-undo', count }), [dispatch]);
  const redo = useCallback(
    (count: number) => dispatch({ action: 'vpage-redo', count }), [dispatch]);
  const cancel = useCallback(() => dispatch({ action: 'vpage-cancel' }), [dispatch]);

  return useMemo(
    () => ({ state, save, rebase, select, apply, undo, redo, cancel }),
    [state, save, rebase, select, apply, undo, redo, cancel]);
}

function initialState(idx: number): VirtualPageState {
  const empty = emptyPage(idx);
  return {
    source: empty, actions: [], render_index: 0, render: empty, sync_errors: [],
    // Starts "loading"; the mount effect adopts this pending select.
    pending_action: { action: 'vpage-select', idx, started: Timestamp.now() },
  };
}