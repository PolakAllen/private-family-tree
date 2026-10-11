import type { Person } from './render_types';
import { formatDate, fullName } from './format';
import { Portrait } from './Portrait';

interface DetailPanelProps {
  person: Person;
  onClose: () => void;
}

export function DetailPanel({ person, onClose }: DetailPanelProps) {
  const paragraphs = person.bio?.split(/\n{2,}/) ?? [];

  return (
    <aside className="ft-panel" aria-label={`Details for ${fullName(person)}`}>
      <button
        type="button"
        className="ft-panel__close"
        onClick={onClose}
        aria-label="Close details"
      >
        ×
      </button>

      <Portrait person={person} className="ft-portrait--large" />

      <h2 className="ft-panel__name">{fullName(person)}</h2>
      {person.birthName && (
        <p className="ft-panel__maiden">Born {person.birthName}</p>
      )}

      <dl className="ft-panel__facts">
        <div>
          <dt>Born</dt>
          <dd>
            {formatDate(person.birth)}
            {person.birthPlace ? `, ${person.birthPlace}` : ''}
          </dd>
        </div>
        {person.death && (
          <div>
            <dt>Died</dt>
            <dd>{formatDate(person.death)}</dd>
          </div>
        )}
      </dl>

      {paragraphs.length > 0 ? (
        <div className="ft-panel__bio">
          {paragraphs.map((text, i) => (
            <p key={i}>{text}</p>
          ))}
        </div>
      ) : (
        <p className="ft-panel__empty">No biography yet.</p>
      )}
    </aside>
  );
}
