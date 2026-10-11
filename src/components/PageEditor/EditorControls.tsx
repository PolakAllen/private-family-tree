interface EditorControlsProps {
  busy: boolean;
  canSave: boolean;
  canCancel: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onSave: () => void;
  onSync: () => void;
  onCancel: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

export default function EditorControls(p: EditorControlsProps) {
  return (
    <div className="pe-controls" role="toolbar" aria-label="Page changes">
      <div>
        <button type="button" disabled={p.busy || !p.canUndo} onClick={p.onUndo}>Undo</button>
        <button type="button" disabled={p.busy || !p.canRedo} onClick={p.onRedo}>Redo</button>
      </div>
      <span className="pe-status" role="status">{p.busy ? 'Working…' : ''}</span>
      <div>
        <button type="button" disabled={p.busy} onClick={p.onSync}>Sync</button>
        <button type="button" disabled={p.busy || !p.canCancel} onClick={p.onCancel}>
          Cancel changes
        </button>
        <button
          type="button"
          className="pe-primary"
          disabled={p.busy || !p.canSave}
          onClick={p.onSave}
        >
          Save
        </button>
      </div>
    </div>
  );
}