import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  Panel,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type NodeTypes,
  type OnSelectionChangeFunc,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './family-tree.css';

import type {
  FamilyFlowNode,
  FamilyTreeData,
  PersonFlowNode,
  PersonId,
} from './render_types';
import { buildFlow } from './layout';
import { PersonNodeView, UnionNodeView } from './nodes';
import { DetailPanel } from './DetailPanel';

// Defined at module scope so the object identity is stable between renders.
const nodeTypes = {
  person: PersonNodeView,
  union: UnionNodeView,
} satisfies NodeTypes;

export interface FamilyTreeProps {
  data: FamilyTreeData;
}

export function FamilyTree({ data }: FamilyTreeProps) {
  const graph = useMemo(() => buildFlow(data), [data]);

  const [nodes, setNodes, onNodesChange] = useNodesState<FamilyFlowNode>(
    graph.nodes,
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(graph.edges);
  const [selectedId, setSelectedId] = useState<PersonId | null>(null);

  // Re-layout when the `data` prop changes.
  useEffect(() => {
    setNodes(graph.nodes);
    setEdges(graph.edges);
    setSelectedId(null);
  }, [graph, setNodes, setEdges]);

  const peopleById = useMemo(
    () => new Map(data.people.map((p) => [p.id, p] as const)),
    [data.people],
  );
  const selectedPerson = selectedId ? peopleById.get(selectedId) : undefined;

  const onSelectionChange = useCallback<
    OnSelectionChangeFunc<FamilyFlowNode, Edge>
  >(({ nodes: selected }) => {
    const person = selected.find(
      (n): n is PersonFlowNode => n.type === 'person',
    );
    setSelectedId(person?.id ?? null);
  }, []);

  const clearSelection = useCallback(() => {
    setNodes((current) =>
      current.map((n) => (n.selected ? { ...n, selected: false } : n)),
    );
  }, [setNodes]);

  return (
    <ReactFlow
      className="ft-flow"
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onSelectionChange={onSelectionChange}
      nodesDraggable={false}
      nodesConnectable={false}
      minZoom={0.2}
      maxZoom={1.5}
      fitView
      fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
    >
      <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} />
      <Controls showInteractive={false} />
      {selectedPerson && (
        <Panel position="top-right">
          <DetailPanel person={selectedPerson} onClose={clearSelection} />
        </Panel>
      )}
    </ReactFlow>
  );
}
