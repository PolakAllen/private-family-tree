import type { Node } from '@xyflow/react';

/* ------------------------------------------------------------------ *
 * Domain model
 * ------------------------------------------------------------------ */

/** ISO 8601 calendar date ("1921-03-04") or just a year ("1921"). */
export type FuzzyDate = `${number}` | `${number}-${number}-${number}`;

export type PersonId = string;
export type UnionId = string;

export interface Person {
  id: PersonId;
  givenName: string;
  familyName: string;
  /** Maiden / birth surname, if different from `familyName`. */
  birthName?: string;
  birth: FuzzyDate;
  /** Absent means "living". */
  death?: FuzzyDate;
  birthPlace?: string;
  /** URL or imported asset path. Falls back to an initials avatar. */
  photoUrl?: string;
  /** Plain text. Blank lines separate paragraphs. */
  bio?: string;
}

/**
 * A couple (or a single parent) and their children. Modelling the
 * relationship as its own entity keeps the graph a clean DAG and lets us
 * handle remarriage, single parents, and unmarried partners uniformly.
 */
export interface Union {
  id: UnionId;
  partners: readonly [PersonId] | readonly [PersonId, PersonId];
  children: readonly PersonId[];
  marriedOn?: FuzzyDate;
}

export interface FamilyTreeData {
  people: readonly Person[];
  unions: readonly Union[];
}

/* ------------------------------------------------------------------ *
 * React Flow node types
 * ------------------------------------------------------------------ */

export type PersonNodeData = { person: Person };
export type UnionNodeData = { union: Union };

export type PersonFlowNode = Node<PersonNodeData, 'person'>;
export type UnionFlowNode = Node<UnionNodeData, 'union'>;

/** Discriminated union of every node we render. */
export type FamilyFlowNode = PersonFlowNode | UnionFlowNode;
