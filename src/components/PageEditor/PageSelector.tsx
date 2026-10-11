interface PageSelectorProps {
  /** Zero-based index of the loaded page; displayed one-based. */
  idx: number;
  firstPageIdx: number;
  pageCount: number;
  disabled: boolean;
  onSelect: (idx: number) => void;
}

export default function PageSelector({ idx, firstPageIdx, pageCount, disabled, onSelect }: PageSelectorProps) {
  return (
    <nav className="pe-pager" aria-label="Page selection">
      <label>
        Page Select:
      </label>
      <select onChange={(e) => onSelect(parseInt(e.currentTarget.value))} disabled={disabled} value={idx}>
        {
          Array.from({ length: pageCount }, (_, i) => firstPageIdx+i).map(i => <option key={i} value={i}>{i}</option>)
        }
      </select>
    </nav>
  );
}