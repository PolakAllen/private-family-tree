
import { useMemo } from 'react';
import type { ColumnDef, PageAction, PageApi } from './types';
import useVirtualPage from '../../data/VirtualPage/useVirtualPage';
import { buildColumns, buildRows, rowHeights } from './PageModel';
import { mergeAction, moveEdgeAction, splitAction } from './EdgeActions';
import { usePageScopedSelection } from './usePageScopedSelection';
import { nowTs } from './timestamp';
import PageSelector from './PageSelector';
import EditorControls from './EditorControls';
import SyncErrorList from './SyncErrorList';
import './PageEditor.css';
import HeaderDisplay from './HeaderDisplay';
import RowDisplay from './RowDisplay';
import RowEditor from './RowEditor';
import { staticFirstPageIdx } from '../../data/staticData';

export interface PageEditorProps {
  api: PageApi;
  userId: string;
  /** One definition per column, in the order shared by every page. */
  columnDefs: ColumnDef[];
  startingIdx: number;
  pageCount: number;
  /** px of extra context shown while dragging a row edge. */
  edgeDragPreviewHeight?: number;
}

export default function PageEditor({
  api, userId, columnDefs, startingIdx, pageCount, edgeDragPreviewHeight = 40,
}: PageEditorProps) {
  const vp = useVirtualPage(startingIdx, api);
  const { source, render, actions, render_index, sync_errors, pending_action } = vp.state;
  const { edges, image } = render;

  const busy = pending_action !== null;
  const isDirty = render_index > 0;
  const rowCount = Math.max(0, edges.y.length - 1);
  const colCount = Math.max(0, edges.x.length - 1);
  const leftEdge = edges.x[0] ?? 0;
  const topEdge = edges.y[0] ?? 0;

  const [selectedRow, selectRow] = usePageScopedSelection(render.idx, rowCount);

  const columns = useMemo(() => buildColumns(edges, columnDefs), [edges, columnDefs]);
  const rows = useMemo(() => buildRows(source, render, columns), [source, render, columns]);
  const heights = useMemo(() => rowHeights(edges), [edges]);
  const tableWidth = colCount > 0 ? edges.x[colCount] - edges.x[0] : 0;

  // Errors are reported through state.sync_errors, so promise rejections are only logged.
  const run = (p: Promise<void>) => p.catch((err) => console.error(err));
  const dispatch = (a: PageAction | null) => {
    if (a && !busy) vp.apply(a);
  };

  const columnHandlers = {
    splitColumn: (col : number) => dispatch(splitAction('x', edges.x, col, userId)),
    deleteColumn: (col : number) => dispatch(mergeAction('x', edges.x, col, userId)),
    moveEdge: (edge: 'left' | 'right', col: number, delta: number) =>
      dispatch(moveEdgeAction('x', edges.x, edge === 'left' ? col : col + 1, delta, userId)),
  };

  return (
    <div className="pe-root" aria-busy={busy}>
      <div className="pe-top">
        <PageSelector
          idx={render.idx}
          firstPageIdx={staticFirstPageIdx}
          pageCount={pageCount}
          disabled={busy || isDirty}
          onSelect={(i) => run(vp.select(i))}
        />
        {isDirty && <span className="pe-note">Save or cancel your changes to switch pages.</span>}
      </div>

      {columns.length !== columnDefs.length && (
        <p className="pe-warning" role="status">
          This page has {columns.length} columns but {columnDefs.length} are expected. Split or delete
          columns until the counts match.
        </p>
      )}

      <div className="pe-table" role="region" aria-label="Page table" tabIndex={0}>
        <div className="pe-table-inner" style={{ width: tableWidth }}>
          <HeaderDisplay
            topEdge={topEdge}
            leftEdge={leftEdge}
            image={image}
            columns={columns}
            {...columnHandlers}
          />
          {rows.map((row, r) => (
            <RowDisplay
              key={r}
              image={image}
              topEdge={edges.y[r]}
              leftEdge={leftEdge}
              height={heights[r]}
              row={row}
              edgeDragPreviewHeight={edgeDragPreviewHeight}
              isSelected={r === selectedRow}
              onClick={() => selectedRow === r ? selectRow(null) : selectRow(r)}
              splitRow={() => dispatch(splitAction('y', edges.y, r, userId))}
              deleteRow={() => dispatch(mergeAction('y', edges.y, r, userId))}
              moveEdge={(edge, delta) =>
                dispatch(moveEdgeAction('y', edges.y, edge === 'top' ? r : r + 1, delta, userId))
              }
            />
          ))}
        </div>
      </div>

      <div className="pe-dock">
        {selectedRow !== null ? (
          <RowEditor
            image={image}
            topEdge={edges.y[selectedRow]}
            leftEdge={leftEdge}
            row={rows[selectedRow]}
            update={(col, val) =>
              dispatch({
                action: 'update-cell-raw',
                row: selectedRow,
                col,
                raw: val,
                on: nowTs(),
                by: userId,
              })
            }
          />
        ) : (
          <p className="pe-hint">Select a row to edit its cells.</p>
        )}

        <EditorControls
          busy={busy}
          canSave={isDirty}
          canCancel={actions.length > 0}
          canUndo={render_index > 0}
          canRedo={render_index < actions.length}
          onSave={() => run(vp.save())}
          onSync={() => run(vp.rebase())}
          onCancel={vp.cancel}
          onUndo={() => vp.undo(1)}
          onRedo={() => vp.redo(1)}
        />
        <SyncErrorList errors={sync_errors} />
      </div>
    </div>
  );
}