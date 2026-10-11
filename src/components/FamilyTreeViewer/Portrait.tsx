import type { Person } from './render_types';
import { fullName, initials } from './format';

interface PortraitProps {
  person: Person;
  className?: string;
}

/** Photo if we have one, otherwise an initials avatar. */
export function Portrait({ person, className }: PortraitProps) {
  const classes = [
    'ft-portrait',
    person.death !== undefined && 'ft-portrait--past',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      {person.photoUrl ? (
        <img
          src={person.photoUrl}
          alt={`Portrait of ${fullName(person)}`}
          loading="lazy"
          draggable={false}
        />
      ) : (
        <span aria-hidden="true">{initials(person)}</span>
      )}
    </div>
  );
}
