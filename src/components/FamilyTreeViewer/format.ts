import type { FuzzyDate, Person } from './render_types';

export const yearOf = (date: FuzzyDate): number => Number(date.slice(0, 4));

export const fullName = (p: Person): string => `${p.givenName} ${p.familyName}`;

export const initials = (p: Person): string =>
  `${p.givenName.charAt(0)}${p.familyName.charAt(0)}`.toUpperCase();

/** "1921 – 1998" for the deceased, "b. 1977" for the living. */
export function lifespan(p: Person): string {
  const born = yearOf(p.birth);
  return p.death ? `${born} – ${yearOf(p.death)}` : `b. ${born}`;
}

/** Full date when we have one, otherwise just the year. */
export function formatDate(date: FuzzyDate): string {
  if (date.length === 4) return date;
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
