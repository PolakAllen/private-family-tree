import type { SyncError } from '../../data/VirtualPage/types';
import { formatTimestamp } from './timestamp';

const TITLES: Record<string, string> = {
  conflict: 'Someone else saved this page first',
  network: 'Could not reach the server',
  merge: 'Your edits could not be applied to the newer version',
};

export default function SyncErrorList({ errors }: { errors: SyncError[] }) {
  if (errors.length === 0) return null;
  return (
    <ul className="pe-errors" role="alert" aria-label="Sync errors">
      {errors.map((e, i) => (
        <li key={`${e.at}-${i}`}>
          <strong>{TITLES[e.style] ?? e.style}</strong> (page {e.for_page + 1},{' '}
          {formatTimestamp(e.at)})
          {e.msg && <div>{e.msg}</div>}
        </li>
      ))}
    </ul>
  );
}