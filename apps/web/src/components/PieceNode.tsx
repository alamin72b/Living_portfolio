import { memo } from 'react';
import { Handle, Position, useStore, type Node, type NodeProps } from '@xyflow/react';
import { ArrowUpRight, Layers, Maximize2, Minimize2 } from 'lucide-react';
import { areaLabels, stageLabels, type Piece } from '@blueprint/shared';
import { BlueprintGlyph } from './BlueprintGlyph';
export type PieceFlowNode = Node<
  {
    piece: Piece;
    onOpen: (id: string) => void;
    onExpand: (id: string) => void;
    expanded: boolean;
    componentCount: number;
    highlight: boolean;
  },
  'piece'
>;
export const PieceNode = memo(function PieceNode({ data, selected }: NodeProps<PieceFlowNode>) {
  const detail = useStore((s) => (s.transform[2] < 0.45 ? 0 : s.transform[2] < 0.8 ? 1 : 2));
  const { piece, onOpen, onExpand, expanded, componentCount, highlight } = data;
  const milestone = piece.milestone;
  const solid =
    milestone?.state === 'accomplishment' ||
    piece.stage === 'working' ||
    piece.stage === 'evolving';
  const stateText = milestone
    ? milestone.state === 'goal'
      ? 'GOAL / BLUEPRINT'
      : 'ACCOMPLISHMENT / REALIZED'
    : piece.stage === 'blueprint'
      ? 'SKETCH / CONCEPT'
      : piece.stage === 'experiment'
        ? 'PARTIAL / EXPLORATION'
        : piece.stage === 'working'
          ? 'SOLID / WORKING'
          : '↗ / EVOLVING';
  return (
    <article
      className={`piece-node stage-${piece.stage} kind-${piece.kind} detail-${detail} ${milestone ? `milestone-${milestone.state}` : ''} ${selected || highlight ? 'highlighted' : ''}`}
      data-stage={piece.stage}
      data-milestone={milestone?.state ?? 'creation'}
    >
      <Handle type="target" position={Position.Left} isConnectable={false} />
      <Handle type="source" position={Position.Right} isConnectable={false} />
      <div className="piece-meta">
        <span>
          {piece.kind === 'project' ? <Layers size={13} /> : <span className="tiny-square" />}
          {piece.area === 'english_communication' ? areaLabels.english_communication : piece.kind}
        </span>
        <span className="stage-dot" title={stageLabels[piece.stage]} />
      </div>
      {detail > 0 && <BlueprintGlyph solid={solid} assembly={piece.kind !== 'fragment'} />}
      <button
        className="piece-title nodrag"
        onClick={() => onOpen(piece.id)}
        aria-label={`Inspect ${piece.title}${milestone ? `, ${milestone.state}` : ''}`}
      >
        <span>{piece.title}</span>
        <ArrowUpRight size={18} />
      </button>
      {detail === 2 && <p className="piece-summary">{piece.summary}</p>}
      <div className="piece-bottom">
        <span>{stateText}</span>
        {componentCount > 0 && (
          <button
            className="expand-button nodrag"
            onClick={(event) => {
              event.stopPropagation();
              onExpand(piece.id);
            }}
            aria-label={`${expanded ? 'Reassemble' : 'Expand'} ${piece.title}`}
            title={expanded ? 'Reassemble' : 'Exploded view'}
          >
            {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />} {componentCount}
          </button>
        )}
      </div>
    </article>
  );
});
