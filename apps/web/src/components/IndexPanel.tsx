import { useState } from 'react';
import { ArrowUpRight, Search } from 'lucide-react';
import { areaLabels, kinds, type Workspace } from '@blueprint/shared';
import { Dialog } from './Dialog';
export function IndexPanel({
  data,
  onClose,
  onSelect,
}: {
  data: Workspace;
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const matches = data.pieces.filter(
    (p) =>
      (filter === 'all' || filter === p.kind || filter === p.milestone?.state) &&
      `${p.title} ${p.summary} ${p.technologies.join(' ')} ${p.area} ${
        p.milestone?.state === 'goal'
          ? `${p.milestone.intention} ${p.milestone.target}`
          : p.milestone?.state === 'accomplishment'
            ? `${p.milestone.achievement} ${p.milestone.result}`
            : ''
      }`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <Dialog title="The index" onClose={onClose}>
      <h2>
        A way into
        <br />
        <em>the workspace.</em>
      </h2>
      <p className="muted">Every piece is here. No panning required.</p>
      <label className="search-field">
        <Search size={18} />
        <input
          autoFocus
          aria-label="Search creations"
          placeholder="A title, idea, or technology…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <kbd>/</kbd>
      </label>
      <div className="filter-row" aria-label="Filter by kind or milestone state">
        {['all', ...kinds, 'goal', 'accomplishment'].map((value) => (
          <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>
            {value}
          </button>
        ))}
      </div>
      <p className="eyebrow" aria-live="polite">
        {matches.length} {matches.length === 1 ? 'PIECE' : 'PIECES'}
      </p>
      {matches.length === 0 ? (
        <div className="index-empty">
          <span className="large-cross">+</span>
          <h3>
            {data.pieces.length ? 'Nothing matches yet.' : 'The first piece is still to come.'}
          </h3>
          <p>
            {data.pieces.length
              ? 'Try another search or choose a different kind.'
              : 'Only genuine creations will appear here. This is the beginning, not an empty résumé.'}
          </p>
        </div>
      ) : (
        <ol className="index-list">
          {matches.map((p, i) => (
            <li key={p.id}>
              <button onClick={() => onSelect(p.id)}>
                <span className="index-number">{String(i + 1).padStart(2, '0')}</span>
                <span>
                  <strong>{p.title}</strong>
                  <small>
                    {p.milestone?.state === 'goal'
                      ? 'goal · blueprint'
                      : p.milestone?.state === 'accomplishment'
                        ? 'accomplishment · realized'
                        : p.area === 'english_communication'
                          ? `${areaLabels.english_communication} · ${p.kind}`
                          : `${p.kind} · ${p.stage}`}
                  </small>
                  <p>{p.summary}</p>
                </span>
                <ArrowUpRight size={18} />
              </button>
            </li>
          ))}
        </ol>
      )}
    </Dialog>
  );
}
