import { useCallback, useMemo, useRef, useState, type Dispatch } from "react";

export type ThunkAction<S, A, R = void> = (
  dispatch: Dispatch<A>,
  getState: () => S
) => R;
export interface ThunkDispatch<S, A> {
  <R>(thunk: ThunkAction<S, A, R>): R;
  (action: A): void;
}

export default function useThunkReducer<S, A>(
  reducer: (s: S, a: A) => S,
  init: () => S
): [S, ThunkDispatch<S, A>] {
  const [state, setState] = useState<S>(init);
  const ref = useRef<S>(state);

  // Reduce eagerly against a ref so thunks always observe the latest state,
  // even between renders.
  const plain = useCallback((a: A) => {
    const next = reducer(ref.current, a);
    if (next !== ref.current) {
      ref.current = next;
      setState(next);
    }
  }, [reducer]);

  const dispatch = useMemo(() => {
    const d = (x: A | ThunkAction<S, A, unknown>) =>
      typeof x === 'function'
        ? (x as ThunkAction<S, A, unknown>)(plain, () => ref.current)
        : plain(x);
    return d as unknown as ThunkDispatch<S, A>;
  }, [plain]);

  return [state, dispatch];
}