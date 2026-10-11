import { graphlib, layout } from '@dagrejs/dagre';
import type { Edge } from '@xyflow/react';
import type {
  FamilyFlowNode,
  FamilyTreeData,
  PersonFlowNode,
  UnionFlowNode,
} from './render_types';

export const PERSON_SIZE = { width: 240, height: 88 } as const;
export const UNION_SIZE = { width: 12, height: 12 } as const;

const ORIGIN = { x: 0, y: 0 } as const;

export interface FlowGraph {
  nodes: FamilyFlowNode[];
  edges: Edge[];
}

/**
 * Converts people + unions into positioned React Flow nodes and edges.
 *
 * Each union becomes a small "junction" node. Partners connect down into it,
 * and it connects down to the children. Dagre's ranking then naturally places
 * partners side by side and children one generation below.
 */
export function buildFlow(data: FamilyTreeData): FlowGraph {
  const personNodes = data.people.map(
    (person): PersonFlowNode => ({
      id: person.id,
      type: 'person',
      position: ORIGIN,
      data: { person },
    }),
  );

  const unionNodes = data.unions.map(
    (union): UnionFlowNode => ({
      id: union.id,
      type: 'union',
      position: ORIGIN,
      data: { union },
      selectable: false,
      focusable: false,
    }),
  );

  const edges: Edge[] = data.unions.flatMap((union) => [
    ...union.partners.map(
      (partnerId): Edge => ({
        id: `${partnerId}->${union.id}`,
        source: partnerId,
        target: union.id,
        type: 'smoothstep',
        className: 'ft-edge ft-edge--partner',
      }),
    ),
    ...union.children.map(
      (childId): Edge => ({
        id: `${union.id}->${childId}`,
        source: union.id,
        target: childId,
        type: 'smoothstep',
        className: 'ft-edge',
      }),
    ),
  ]);

  const g = new graphlib.Graph();
  g.setGraph({ rankdir: 'TB', nodesep: 56, ranksep: 72 });
  g.setDefaultEdgeLabel(() => ({}));

  const sizeOf = (node: FamilyFlowNode) =>
    node.type === 'person' ? PERSON_SIZE : UNION_SIZE;

  const allNodes: FamilyFlowNode[] = [...personNodes, ...unionNodes];
  allNodes.forEach((node) => g.setNode(node.id, { ...sizeOf(node) }));
  edges.forEach((edge) => g.setEdge(edge.source, edge.target));

  layout(g);

  // Dagre returns node centres; React Flow wants top-left corners.
  const nodes = allNodes.map((node): FamilyFlowNode => {
    const { x, y } = g.node(node.id);
    const { width, height } = sizeOf(node);
    return { ...node, position: { x: x - width / 2, y: y - height / 2 } };
  });

  return { nodes, edges };
}
