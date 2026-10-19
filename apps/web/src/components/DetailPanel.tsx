import { useState } from 'react';
import { ArrowUpRight, Github, Layers } from 'lucide-react';
import {
  areaLabels,
  relationLabels,
  stageLabels,
  type Piece,
  type Workspace,
} from '@blueprint/shared';
import { Dialog } from './Dialog';
import { BlueprintGlyph } from './BlueprintGlyph';
export function DetailPanel({
  piece,
  data,
  onClose,
  onSelect,
  onExpand,
  expanded,
}: {
  piece: Piece;
  data: Workspace;
  onClose: () => void;
  onSelect: (id: string) => void;
  onExpand: () => void;
  expanded: boolean;
}) {
  const [loaded, setLoaded] = useState<string[]>([]);
  const connected = data.connections.filter(
    (e) => e.sourceId === piece.id || e.targetId === piece.id,
  );
  const milestone = piece.milestone;
  const solid =
    milestone?.state === 'accomplishment' ||
    piece.stage === 'working' ||
    piece.stage === 'evolving';
  return (
    <Dialog title="Inside the creation" onClose={onClose}>
      <div
        className={`detail-illustration stage-${piece.stage} ${milestone ? `milestone-${milestone.state}` : ''}`}
      >
        <BlueprintGlyph solid={solid} assembly={piece.kind !== 'fragment'} />
        <span>
          {piece.area === 'english_communication' ? areaLabels.english_communication : piece.kind} /{' '}
          {milestone?.state === 'goal'
            ? 'goal / blueprint'
            : milestone?.state === 'accomplishment'
              ? 'accomplishment / realized'
              : piece.stage}
        </span>
      </div>
      {piece.attribution === 'neutral-demo' && (
        <p className="notice">Illustrative example. This is not an achievement of the owner.</p>
      )}
      {piece.attribution === 'ai-infrastructure' && (
        <p className="notice">AI-built portfolio infrastructure; not authored by the owner.</p>
      )}
      <h2>{piece.title}</h2>
      <p className="lead">{piece.summary}</p>
      <span className="state-label">
        <span className="stage-dot" />
        {milestone?.state === 'goal'
          ? 'An intention taking shape'
          : milestone?.state === 'accomplishment'
            ? 'An accomplishment made solid'
            : stageLabels[piece.stage]}
      </span>
      {milestone?.state === 'goal' && (
        <section className="milestone-card milestone-goal-card">
          <h3>Intention</h3>
          <p className="prose">{milestone.intention}</p>
          {milestone.description && <p className="prose">{milestone.description}</p>}
          {milestone.target && (
            <p>
              <strong>Target</strong> {milestone.target}
            </p>
          )}
          {milestone.targetDate && (
            <p>
              <strong>Target date</strong> {milestone.targetDate}
            </p>
          )}
        </section>
      )}
      {milestone?.state === 'accomplishment' && (
        <section className="milestone-card milestone-accomplishment-card">
          <h3>Accomplishment</h3>
          <p className="prose">{milestone.achievement}</p>
          {milestone.description && <p className="prose">{milestone.description}</p>}
          {milestone.result && (
            <p>
              <strong>Result</strong> {milestone.result}
            </p>
          )}
          {milestone.completedDate && (
            <p>
              <strong>Completed</strong> {milestone.completedDate}
            </p>
          )}
        </section>
      )}
      {milestone && piece.evidence.length === 0 && (
        <p className="notice">
          Owner-attested. No supporting material was supplied, so this is not independently
          verified.
        </p>
      )}
      <div className="detail-links">
        {piece.repositoryUrl && (
          <a href={piece.repositoryUrl} target="_blank" rel="noopener noreferrer">
            <Github size={16} /> Source code
            <ArrowUpRight size={14} />
          </a>
        )}
        {piece.liveUrl && (
          <a href={piece.liveUrl} target="_blank" rel="noopener noreferrer">
            Open creation
            <ArrowUpRight size={16} />
          </a>
        )}
      </div>
      {piece.body && (
        <section>
          <h3>The idea & the implementation</h3>
          <p className="prose">{piece.body}</p>
        </section>
      )}
      {piece.technologies.length > 0 && (
        <section>
          <h3>Made with</h3>
          <div className="tags">
            {piece.technologies.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </section>
      )}
      {connected.length > 0 && (
        <section>
          <h3>Connected, still independent</h3>
          {piece.kind !== 'fragment' && (
            <button className="secondary-button full" onClick={onExpand}>
              <Layers size={16} />
              {expanded ? 'Reassemble the pieces' : 'Reveal the constituent pieces'}
            </button>
          )}
          <ul className="relationship-list">
            {connected.map((edge) => {
              const outbound = edge.sourceId === piece.id;
              const other = data.pieces.find(
                (p) => p.id === (outbound ? edge.targetId : edge.sourceId),
              );
              if (!other) return null;
              return (
                <li key={edge.id}>
                  <span>
                    {outbound
                      ? relationLabels[edge.type]
                      : `${other.title} ${relationLabels[edge.type]} this`}
                  </span>
                  <button onClick={() => onSelect(other.id)}>
                    {other.title}
                    <ArrowUpRight size={15} />
                  </button>
                  {edge.note && <small>{edge.note}</small>}
                </li>
              );
            })}
          </ul>
        </section>
      )}
      {piece.media.length > 0 && (
        <section>
          <h3>A closer look</h3>
          {piece.media.map((m) => (
            <figure key={m.url}>
              {m.kind === 'image' ? (
                <img src={m.url} alt={m.alt} loading="lazy" referrerPolicy="no-referrer" />
              ) : m.kind === 'video' ? (
                <video src={m.url} controls preload="none" aria-label={m.alt} />
              ) : data.previewOrigins.includes(new URL(m.url).origin) ? (
                loaded.includes(m.url) ? (
                  <iframe
                    title={m.alt}
                    src={m.url}
                    sandbox="allow-scripts"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    allow="camera 'none'; microphone 'none'; geolocation 'none'"
                  />
                ) : (
                  <button
                    className="secondary-button full"
                    onClick={() => setLoaded((v) => [...v, m.url])}
                  >
                    Load isolated preview
                  </button>
                )
              ) : (
                <a href={m.url} target="_blank" rel="noopener noreferrer">
                  Open preview in a new tab ↗
                </a>
              )}
              <figcaption>{m.alt}</figcaption>
            </figure>
          ))}
        </section>
      )}
      {piece.notes && (
        <section>
          <h3>Notes from the making</h3>
          <p className="prose">{piece.notes}</p>
        </section>
      )}
      {piece.evidence.length > 0 && (
        <section>
          <h3>Evidence</h3>
          <ul className="evidence-list">
            {piece.evidence.map((e, i) => (
              <li key={i}>
                {e.claim}
                {e.url && (
                  <a href={e.url} target="_blank" rel="noopener noreferrer">
                    View source ↗
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="revision-caption">
        Revision {piece.revisionNumber} · Stable identity, room to evolve.
      </p>
    </Dialog>
  );
}
