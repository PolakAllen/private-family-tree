import { useCallback, useState } from 'react';

/**
 * A selected index that is only valid for the page it was made on and while it
 * is still in range, so no reset effects are needed on page change or deletes.
 */
export function usePageScopedSelection(pageIdx: number, limit: number) {
  const [sel, setSel] = useState<{ page: number; i: number } | null>(null);
  const value = sel && sel.page === pageIdx && sel.i < limit ? sel.i : null;
  const set = useCallback(
    (i: number | null) => setSel(i === null ? null : { page: pageIdx, i }),
    [pageIdx],
  );
  return [value, set] as const;
}