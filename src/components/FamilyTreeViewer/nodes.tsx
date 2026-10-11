import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { PersonFlowNode, UnionFlowNode } from './render_types';
import { formatDate, fullName, lifespan } from './format';
import { Portrait } from './Portrait';

export const PersonNodeView = memo(function PersonNodeView({
  data,
  selected,
}: NodeProps<PersonFlowNode>) {
  const { person } = data;
  const name = fullName(person);

  return (
    <div
      className={selected ? 'ft-card ft-card--selected' : 'ft-card'}
      aria-label={`${name}, ${lifespan(person)}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={false}
        className="ft-handle"
      />
      <Portrait person={person} />
      <div className="ft-card__text">
        <div className="ft-card__name" title={name}>
          {name}
        </div>
        {person.birthName && (
          <div className="ft-card__maiden">née {person.birthName}</div>
        )}
        <div className="ft-card__dates">{lifespan(person)}</div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={false}
        className="ft-handle"
      />
    </div>
  );
});

export const UnionNodeView = memo(function UnionNodeView({
  data,
}: NodeProps<UnionFlowNode>) {
  const { marriedOn } = data.union;

  return (
    <div
      className="ft-union"
      title={marriedOn ? `Married ${formatDate(marriedOn)}` : undefined}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={false}
        className="ft-handle"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={false}
        className="ft-handle"
      />
    </div>
  );
});
