import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  Check,
  Eye,
  FilePlus2,
  LockKeyhole,
  LogOut,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from 'lucide-react';
import {
  defaultProfile,
  emptyWorkspace,
  areas,
  areaLabels,
  kinds,
  milestoneLabel,
  milestoneSummary,
  relationTypes,
  stages,
  type DraftInput,
  type PieceContent,
  type Preview,
  type Profile,
  type Revision,
  type Workspace as WorkspaceData,
} from '@blueprint/shared';
import { request } from '../api';
import { Workspace } from './Workspace';
const fresh = (): PieceContent => ({
  title: '',
  kind: 'fragment',
  stage: 'experiment',
  area: 'general',
  summary: '',
  body: '',
  technologies: [],
  repositoryUrl: '',
  liveUrl: '',
  notes: '',
  attribution: 'owner',
  position: { x: 560, y: 0 },
  evidence: [{ claim: '', url: '', note: '', visibility: 'private' }],
  media: [],
  relationships: [],
});
const blankEvidence = () => ({ claim: '', url: '', note: '', visibility: 'private' as const });
type EntryType = 'creation' | 'goal' | 'accomplishment';
function short(value: string, max: number) {
  return value.slice(0, max);
}
type DraftList = { revisions: Revision[] };
export default function Studio({ onClose }: { onClose: () => void }) {
  const [token, setToken] = useState('');
  const [credential, setCredential] = useState('');
  const [role, setRole] = useState<'owner' | 'agent' | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [data, setData] = useState<WorkspaceData>(emptyWorkspace);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [selection, setSelection] = useState<Revision | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [viewPreview, setViewPreview] = useState(false);
  const [seenPreview, setSeenPreview] = useState(false);
  const [verified, setVerified] = useState(false);
  const [content, setContent] = useState<PieceContent>(fresh);
  const [technologyInput, setTechnologyInput] = useState('');
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [entityType, setEntityType] = useState<'piece' | 'profile'>('piece');
  const [pieceId, setPieceId] = useState<string | undefined>();
  const [baseRevisionId, setBaseRevisionId] = useState<string | null>(null);
  const [editing, setEditing] = useState(true);
  const entryType: EntryType = content.milestone?.state ?? 'creation';
  const api = useCallback(
    <T,>(path: string, method = 'GET', body?: unknown) => request<T>(path, { token, method, body }),
    [token],
  );
  const refresh = useCallback(async () => {
    const [w, r] = await Promise.all([
      api<WorkspaceData>('/admin/workspace'),
      api<DraftList>('/admin/revisions'),
    ]);
    setData(w);
    setRevisions(r.revisions);
  }, [api]);
  useEffect(() => {
    if (token) void refresh().catch((e) => setError(e.message));
  }, [token, refresh]);
  async function action(fn: () => Promise<void>) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The request failed.');
    } finally {
      setBusy(false);
    }
  }
  async function login(e: FormEvent) {
    e.preventDefault();
    await action(async () => {
      const result = await request<{ role: 'owner' | 'agent' }>('/admin/session', {
        token: credential,
      });
      setToken(credential);
      setRole(result.role);
      setCredential('');
    });
  }
  function newPiece() {
    setEntityType('piece');
    setContent(fresh());
    setTechnologyInput('');
    setPieceId(undefined);
    setBaseRevisionId(null);
    setSelection(null);
    setPreview(null);
    setEditing(true);
    setSeenPreview(false);
    setVerified(false);
  }
  function setEntryType(next: EntryType) {
    setContent((current) => {
      const evidence =
        current.evidence.length === 1 && !current.evidence[0].claim.trim() ? [] : current.evidence;
      if (next === 'creation')
        return {
          ...current,
          area: 'general',
          kind: 'fragment',
          stage: 'experiment',
          milestone: undefined,
          evidence: evidence.length ? evidence : [blankEvidence()],
        };
      if (next === 'goal')
        return {
          ...current,
          area: 'english_communication',
          kind: 'fragment',
          stage: 'blueprint',
          milestone:
            current.milestone?.state === 'goal'
              ? current.milestone
              : { state: 'goal', intention: '', description: '', target: '', targetDate: '' },
          evidence,
        };
      return {
        ...current,
        area: 'english_communication',
        kind: 'fragment',
        stage: 'working',
        milestone:
          current.milestone?.state === 'accomplishment'
            ? current.milestone
            : {
                state: 'accomplishment',
                achievement: '',
                description: '',
                result: '',
                completedDate: '',
              },
        evidence,
      };
    });
  }
  function updateMilestone(
    update: (
      value: NonNullable<PieceContent['milestone']>,
    ) => NonNullable<PieceContent['milestone']>,
  ) {
    setContent((current) =>
      current.milestone ? { ...current, milestone: update(current.milestone) } : current,
    );
  }
  function buildPieceContent(): PieceContent {
    const technologies = technologyInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (!content.milestone) return { ...content, technologies };
    return {
      ...content,
      title: short(milestoneLabel(content.milestone), 100),
      summary: short(milestoneSummary(content.milestone), 280),
      body: content.milestone.description,
      kind: 'fragment',
      stage: content.milestone.state === 'goal' ? 'blueprint' : 'working',
      area: 'english_communication',
      technologies: [],
      repositoryUrl: '',
      liveUrl: '',
      evidence: content.evidence.filter((e) => e.claim.trim()),
    };
  }
  function select(r: Revision) {
    setSelection(r);
    setPreview(null);
    setEditing(false);
    setSeenPreview(false);
    setVerified(false);
    setError('');
    setNotice('');
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    await action(async () => {
      const payload: DraftInput =
        entityType === 'piece'
          ? {
              entityType,
              pieceId,
              baseRevisionId,
              content: buildPieceContent(),
            }
          : { entityType, baseRevisionId, content: profile };
      const result = await api<Revision>('/admin/drafts', 'POST', payload);
      select(result);
      await refresh();
      setNotice('Draft saved. Nothing has been published.');
    });
  }
  async function validate() {
    if (!selection) return;
    await action(async () => {
      await api(`/admin/revisions/${selection.id}/validate`, 'POST', {});
      const result = await api<Preview>(`/admin/revisions/${selection.id}/preview`);
      setPreview(result);
      setSelection(result.revision);
      setVerified(false);
      setSeenPreview(false);
      await refresh();
      setNotice('Validation passed. Inspect the private spatial preview, then review every claim.');
    });
  }
  async function approve() {
    if (!selection || !preview) return;
    await action(async () => {
      const result = await api<Revision>(`/admin/revisions/${selection.id}/approve`, 'POST', {
        digest: preview.digest,
        verified: true,
      });
      setSelection(result);
      await refresh();
      setNotice('Approved. Select Publish when you are ready to make this revision public.');
    });
  }
  async function publish() {
    if (!selection || !preview) return;
    await action(async () => {
      await api(`/admin/revisions/${selection.id}/publish`, 'POST', { digest: preview.digest });
      await refresh();
      setPreview(null);
      setSelection(null);
      setNotice('Published. The public workspace now contains your approved revision.');
    });
  }
  async function editRevision(r: Revision) {
    setSelection(null);
    setPreview(null);
    setEntityType(r.entityType);
    setPieceId(r.entityType === 'piece' ? r.entityId : undefined);
    setBaseRevisionId(
      r.entityType === 'piece'
        ? (data.pieces.find((p) => p.id === r.entityId)?.revisionId ?? null)
        : data.profileRevisionId,
    );
    if (r.entityType === 'piece') {
      setContent(r.content as PieceContent);
      setTechnologyInput((r.content as PieceContent).technologies.join(', '));
    } else setProfile(r.content as Profile);
    setEditing(true);
    setSeenPreview(false);
    setVerified(false);
  }
  async function loadExisting(id: string) {
    await action(async () => {
      const r = await api<Revision>(`/admin/pieces/${id}`);
      await editRevision(r);
    });
  }
  const field = <K extends keyof PieceContent>(key: K, value: PieceContent[K]) =>
    setContent((c) => ({ ...c, [key]: value }));
  if (viewPreview && preview)
    return (
      <Workspace
        data={preview.workspace}
        mode="preview"
        onClose={() => {
          setViewPreview(false);
          setSeenPreview(true);
        }}
      />
    );
  if (!role)
    return (
      <main className="studio-login">
        <button className="text-button" onClick={onClose}>
          <ArrowLeft size={16} /> Return to the workspace
        </button>
        <div className="login-card">
          <LockKeyhole size={30} />
          <span className="eyebrow">PRIVATE WORKSPACE STUDIO</span>
          <h1>
            Carefully made.
            <br />
            <em>Deliberately shared.</em>
          </h1>
          <p>Create drafts, review the evidence, and decide what becomes public.</p>
          <form onSubmit={login}>
            <label>
              Owner or agent access token
              <input
                type="password"
                value={credential}
                onChange={(e) => setCredential(e.target.value)}
                required
                autoComplete="off"
                minLength={32}
              />
            </label>
            <button className="primary-button" disabled={busy}>
              {busy ? 'Connecting…' : 'Open studio'} <ArrowLeft className="rotate" size={16} />
            </button>
          </form>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <small>
            Use the token in your local .env file. It stays in memory and is cleared when this page
            closes. An agent can prepare content; only the owner can publish.
          </small>
        </div>
      </main>
    );
  return (
    <main className="studio">
      <header className="studio-header">
        <button className="text-button" onClick={onClose}>
          <ArrowLeft size={17} /> Workspace
        </button>
        <strong>
          THE LIVING BLUEPRINT <span>/ STUDIO</span>
        </strong>
        <span className="role-badge">{role}</span>
        <button
          className="icon-button"
          onClick={() => {
            setToken('');
            setRole(null);
            setSelection(null);
            setPreview(null);
          }}
          aria-label="Sign out"
        >
          <LogOut size={18} />
        </button>
      </header>
      <div className="studio-body">
        <aside className="studio-sidebar">
          <button className="primary-button full" onClick={newPiece}>
            <FilePlus2 size={17} /> New creation
          </button>
          <button
            className="secondary-button full"
            onClick={() => {
              setEntityType('profile');
              setProfile(data.profile);
              setBaseRevisionId(data.profileRevisionId);
              setSelection(null);
              setPreview(null);
              setEditing(true);
            }}
          >
            Edit introduction
          </button>
          <h2>Published pieces</h2>
          {data.pieces.length === 0 && <p className="muted">Nothing published yet.</p>}
          {data.pieces.map((p) => (
            <button key={p.id} className="sidebar-item" onClick={() => loadExisting(p.id)}>
              <strong>{p.title}</strong>
              <small>
                {p.kind} · revision {p.revisionNumber}
              </small>
            </button>
          ))}
          <div className="sidebar-heading">
            <h2>Revision history</h2>
            <button
              className="icon-button"
              onClick={() => action(refresh)}
              aria-label="Refresh revisions"
            >
              <RefreshCw size={15} />
            </button>
          </div>
          {revisions.map((r) => (
            <button
              key={r.id}
              className={`sidebar-item ${selection?.id === r.id ? 'active' : ''}`}
              onClick={() => select(r)}
            >
              <strong>{'title' in r.content ? r.content.title : r.content.name}</strong>
              <small>
                v{r.number} · {r.status} · {r.createdBy}
              </small>
            </button>
          ))}
        </aside>
        <section className="studio-content" aria-live="polite">
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          {notice && (
            <div className="notice" role="status">
              {notice}
            </div>
          )}
          {editing && !selection ? (
            <form onSubmit={save}>
              <span className="eyebrow">
                {baseRevisionId ? 'A NEW REVISION' : 'A NEW BEGINNING'}
              </span>
              <h1>
                {entityType === 'piece' ? 'Give your creation a place.' : 'Introduce yourself.'}
              </h1>
              <p className="muted">
                Saving creates a private draft. Publication is a separate, owner-approved step.
              </p>
              {entityType === 'profile' ? (
                <>
                  <label>
                    Your name
                    <input
                      value={profile.name}
                      onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                      required
                      maxLength={100}
                    />
                  </label>
                  <label>
                    Headline
                    <input
                      value={profile.headline}
                      onChange={(e) => setProfile((p) => ({ ...p, headline: e.target.value }))}
                      required
                      maxLength={200}
                    />
                  </label>
                  <label>
                    Introduction
                    <textarea
                      value={profile.introduction}
                      onChange={(e) => setProfile((p) => ({ ...p, introduction: e.target.value }))}
                      required
                      maxLength={1200}
                    />
                  </label>
                  <label>
                    Email (optional)
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                    />
                  </label>
                  <label>
                    GitHub profile (optional)
                    <input
                      type="url"
                      value={profile.githubUrl}
                      onChange={(e) => setProfile((p) => ({ ...p, githubUrl: e.target.value }))}
                    />
                  </label>
                </>
              ) : (
                <>
                  <label>
                    Piece type
                    <select
                      value={entryType}
                      onChange={(e) => setEntryType(e.target.value as EntryType)}
                    >
                      <option value="creation">Independent creation</option>
                      <option value="goal">English &amp; Communication goal (blueprint)</option>
                      <option value="accomplishment">
                        English &amp; Communication accomplishment (realized)
                      </option>
                    </select>
                  </label>
                  {entryType === 'creation' ? (
                    <>
                      <label>
                        Creation title
                        <input
                          required
                          maxLength={100}
                          value={content.title}
                          onChange={(e) => field('title', e.target.value)}
                          placeholder="e.g. My first JavaScript calculator"
                        />
                      </label>
                      <div className="form-row">
                        <label>
                          Kind
                          <select
                            value={content.kind}
                            onChange={(e) => field('kind', e.target.value as PieceContent['kind'])}
                          >
                            {kinds.map((k) => (
                              <option key={k}>{k}</option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Actual development stage
                          <select
                            value={content.stage}
                            onChange={(e) =>
                              field('stage', e.target.value as PieceContent['stage'])
                            }
                          >
                            {stages.map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <label>
                        Workspace area
                        <select
                          value={content.area}
                          onChange={(e) => field('area', e.target.value as PieceContent['area'])}
                        >
                          {areas.map((area) => (
                            <option key={area} value={area}>
                              {areaLabels[area]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        A short description
                        <textarea
                          required
                          maxLength={280}
                          value={content.summary}
                          onChange={(e) => field('summary', e.target.value)}
                          placeholder="What does it actually do?"
                        />
                      </label>
                      <label>
                        The idea and implementation
                        <textarea
                          rows={5}
                          maxLength={12000}
                          value={content.body}
                          onChange={(e) => field('body', e.target.value)}
                        />
                      </label>
                      <div className="form-row">
                        <label>
                          Repository URL (optional)
                          <input
                            type="url"
                            value={content.repositoryUrl}
                            onChange={(e) => field('repositoryUrl', e.target.value)}
                            placeholder="https://github.com/…"
                          />
                        </label>
                        <label>
                          Live application (optional)
                          <input
                            type="url"
                            value={content.liveUrl}
                            onChange={(e) => field('liveUrl', e.target.value)}
                            placeholder="https://…"
                          />
                        </label>
                      </div>
                      <label>
                        Technologies actually used (comma separated)
                        <input
                          value={technologyInput}
                          onChange={(e) => setTechnologyInput(e.target.value)}
                        />
                      </label>
                    </>
                  ) : content.milestone?.state === 'goal' ? (
                    <div className="milestone-form">
                      <p className="form-note">
                        This piece stays a blueprint until you actually accomplish it. It keeps its
                        identity when you later update it to an accomplishment.
                      </p>
                      <label>
                        What do you intend to achieve?
                        <input
                          required
                          maxLength={500}
                          value={content.milestone.intention}
                          onChange={(e) =>
                            updateMilestone((m) =>
                              m.state === 'goal' ? { ...m, intention: e.target.value } : m,
                            )
                          }
                          placeholder="e.g. Complete an English course"
                        />
                      </label>
                      <label>
                        Description (optional)
                        <textarea
                          maxLength={1200}
                          value={content.milestone.description}
                          onChange={(e) =>
                            updateMilestone((m) =>
                              m.state === 'goal' ? { ...m, description: e.target.value } : m,
                            )
                          }
                        />
                      </label>
                      <div className="form-row">
                        <label>
                          Target (optional)
                          <input
                            maxLength={500}
                            value={content.milestone.target}
                            onChange={(e) =>
                              updateMilestone((m) =>
                                m.state === 'goal' ? { ...m, target: e.target.value } : m,
                              )
                            }
                          />
                        </label>
                        <label>
                          Target date (optional)
                          <input
                            type="date"
                            value={content.milestone.targetDate}
                            onChange={(e) =>
                              updateMilestone((m) =>
                                m.state === 'goal' ? { ...m, targetDate: e.target.value } : m,
                              )
                            }
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="milestone-form">
                      <p className="form-note">
                        Record only what you actually achieved. If a result does not meet a target,
                        keep the original goal as a blueprint instead of changing it.
                      </p>
                      <label>
                        What did you actually achieve?
                        <input
                          required
                          maxLength={500}
                          value={content.milestone?.achievement ?? ''}
                          onChange={(e) =>
                            updateMilestone((m) =>
                              m.state === 'accomplishment'
                                ? { ...m, achievement: e.target.value }
                                : m,
                            )
                          }
                          placeholder="e.g. Completed the English course"
                        />
                      </label>
                      <label>
                        Description (optional)
                        <textarea
                          maxLength={1200}
                          value={content.milestone?.description ?? ''}
                          onChange={(e) =>
                            updateMilestone((m) =>
                              m.state === 'accomplishment'
                                ? { ...m, description: e.target.value }
                                : m,
                            )
                          }
                        />
                      </label>
                      <div className="form-row">
                        <label>
                          Result (optional)
                          <input
                            maxLength={500}
                            value={content.milestone?.result ?? ''}
                            onChange={(e) =>
                              updateMilestone((m) =>
                                m.state === 'accomplishment' ? { ...m, result: e.target.value } : m,
                              )
                            }
                          />
                        </label>
                        <label>
                          Completion date (optional)
                          <input
                            type="date"
                            value={content.milestone?.completedDate ?? ''}
                            onChange={(e) =>
                              updateMilestone((m) =>
                                m.state === 'accomplishment'
                                  ? { ...m, completedDate: e.target.value }
                                  : m,
                              )
                            }
                          />
                        </label>
                      </div>
                    </div>
                  )}
                  <fieldset>
                    <legend>
                      {entryType === 'creation'
                        ? 'Evidence for the claims'
                        : 'Optional supporting material'}
                    </legend>
                    <p>
                      {entryType === 'creation'
                        ? 'Link to work you completed, and explain what it proves. Private evidence stays in the studio.'
                        : 'Certificates, links, screenshots, and other material are optional. Your owner approval can attest to this milestone.'}
                    </p>
                    {content.evidence.map((e, i) => (
                      <div className="evidence-form" key={i}>
                        <label>
                          Claim supported
                          <input
                            required={entryType === 'creation'}
                            maxLength={500}
                            value={e.claim}
                            onChange={(v) =>
                              field(
                                'evidence',
                                content.evidence.map((item, j) =>
                                  j === i ? { ...item, claim: v.target.value } : item,
                                ),
                              )
                            }
                          />
                        </label>
                        <label>
                          Evidence URL (optional)
                          <input
                            type="url"
                            value={e.url}
                            onChange={(v) =>
                              field(
                                'evidence',
                                content.evidence.map((item, j) =>
                                  j === i ? { ...item, url: v.target.value } : item,
                                ),
                              )
                            }
                          />
                        </label>
                        <label>
                          Private review notes
                          <textarea
                            value={e.note}
                            maxLength={2000}
                            onChange={(v) =>
                              field(
                                'evidence',
                                content.evidence.map((item, j) =>
                                  j === i ? { ...item, note: v.target.value } : item,
                                ),
                              )
                            }
                          />
                        </label>
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={e.visibility === 'public'}
                            onChange={(v) =>
                              field(
                                'evidence',
                                content.evidence.map((item, j) =>
                                  j === i
                                    ? {
                                        ...item,
                                        visibility: v.target.checked ? 'public' : 'private',
                                      }
                                    : item,
                                ),
                              )
                            }
                          />{' '}
                          Share the claim and URL publicly (notes stay private).
                        </label>
                        {content.evidence.length > 1 && (
                          <button
                            type="button"
                            className="text-button"
                            onClick={() =>
                              field(
                                'evidence',
                                content.evidence.filter((_, j) => j !== i),
                              )
                            }
                          >
                            <Trash2 size={14} /> Remove evidence
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => field('evidence', [...content.evidence, blankEvidence()])}
                    >
                      <Plus size={14} /> Add evidence
                    </button>
                  </fieldset>
                  <fieldset>
                    <legend>Connections to existing work</legend>
                    <p>
                      Choose meaningful relationships. Sharing a programming language is not a
                      composition relationship.
                    </p>
                    {content.relationships.map((r, i) => (
                      <div key={i} className="relationship-form">
                        <select
                          aria-label="Relationship type"
                          value={r.type}
                          onChange={(e) =>
                            field(
                              'relationships',
                              content.relationships.map((x, j) =>
                                j === i ? { ...x, type: e.target.value as typeof r.type } : x,
                              ),
                            )
                          }
                        >
                          {relationTypes.map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </select>
                        <select
                          aria-label="Related creation"
                          value={r.targetId}
                          onChange={(e) =>
                            field(
                              'relationships',
                              content.relationships.map((x, j) =>
                                j === i ? { ...x, targetId: e.target.value } : x,
                              ),
                            )
                          }
                        >
                          {data.pieces
                            .filter((p) => p.id !== pieceId)
                            .map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.title}
                              </option>
                            ))}
                        </select>
                        <button
                          type="button"
                          className="icon-button"
                          aria-label="Remove relationship"
                          onClick={() =>
                            field(
                              'relationships',
                              content.relationships.filter((_, j) => j !== i),
                            )
                          }
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="text-button"
                      disabled={!data.pieces.some((p) => p.id !== pieceId)}
                      onClick={() =>
                        field('relationships', [
                          ...content.relationships,
                          {
                            targetId: data.pieces.find((p) => p.id !== pieceId)!.id,
                            type: content.kind === 'fragment' ? 'reuses' : 'contains',
                            note: '',
                          },
                        ])
                      }
                    >
                      <Plus size={14} /> Connect a published piece
                    </button>
                  </fieldset>
                  <details>
                    <summary>Media, notes, position & attribution</summary>
                    <label>
                      Development notes (public)
                      <textarea
                        maxLength={6000}
                        value={content.notes}
                        onChange={(e) => field('notes', e.target.value)}
                      />
                    </label>
                    <label>
                      Who made this work?
                      <select
                        value={content.attribution}
                        onChange={(e) =>
                          field('attribution', e.target.value as PieceContent['attribution'])
                        }
                      >
                        <option value="owner">My own creation</option>
                        <option value="ai-infrastructure">AI-built portfolio infrastructure</option>
                        <option value="neutral-demo">Neutral demonstration</option>
                      </select>
                    </label>
                    <div className="form-row">
                      <label>
                        Canvas X
                        <input
                          type="number"
                          min={-100000}
                          max={100000}
                          value={content.position.x}
                          onChange={(e) =>
                            field('position', { ...content.position, x: Number(e.target.value) })
                          }
                        />
                      </label>
                      <label>
                        Canvas Y
                        <input
                          type="number"
                          min={-100000}
                          max={100000}
                          value={content.position.y}
                          onChange={(e) =>
                            field('position', { ...content.position, y: Number(e.target.value) })
                          }
                        />
                      </label>
                    </div>
                    {content.media.map((m, i) => (
                      <div className="evidence-form" key={i}>
                        <label>
                          Media type
                          <select
                            value={m.kind}
                            onChange={(e) =>
                              field(
                                'media',
                                content.media.map((x, j) =>
                                  j === i ? { ...x, kind: e.target.value as typeof m.kind } : x,
                                ),
                              )
                            }
                          >
                            <option>image</option>
                            <option>video</option>
                            <option>preview</option>
                          </select>
                        </label>
                        <label>
                          HTTPS media URL
                          <input
                            required
                            type="url"
                            value={m.url}
                            onChange={(e) =>
                              field(
                                'media',
                                content.media.map((x, j) =>
                                  j === i ? { ...x, url: e.target.value } : x,
                                ),
                              )
                            }
                          />
                        </label>
                        <label>
                          Accessible description
                          <input
                            required
                            value={m.alt}
                            onChange={(e) =>
                              field(
                                'media',
                                content.media.map((x, j) =>
                                  j === i ? { ...x, alt: e.target.value } : x,
                                ),
                              )
                            }
                          />
                        </label>
                        <button
                          type="button"
                          className="text-button"
                          onClick={() =>
                            field(
                              'media',
                              content.media.filter((_, j) => j !== i),
                            )
                          }
                        >
                          Remove media
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="text-button"
                      onClick={() =>
                        field('media', [...content.media, { kind: 'image', url: '', alt: '' }])
                      }
                    >
                      <Plus size={14} /> Add media
                    </button>
                  </details>
                </>
              )}
              <button disabled={busy} className="primary-button">
                <Save size={17} />
                {busy ? 'Saving…' : 'Save private draft'}
              </button>
            </form>
          ) : selection ? (
            <div className="revision-review">
              <span className="eyebrow">
                REVISION {selection.number} / {selection.status.toUpperCase()}
              </span>
              <h1>
                {'title' in selection.content ? selection.content.title : selection.content.name}
              </h1>
              <p className="lead">
                {'summary' in selection.content
                  ? selection.content.summary
                  : selection.content.headline}
              </p>
              <div className="workflow-track" aria-label="Publishing steps">
                {['draft', 'validated', 'previewed', 'approved', 'published'].map((s) => (
                  <span
                    key={s}
                    className={
                      selection.status === s || (s === 'previewed' && seenPreview) ? 'current' : ''
                    }
                  >
                    {s}
                  </span>
                ))}
              </div>
              <details open>
                <summary>Review the complete proposed content</summary>
                <pre className="review-json">{JSON.stringify(selection.content, null, 2)}</pre>
              </details>
              {preview && preview.warnings.length > 0 && (
                <ul className="notice">
                  {preview.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              )}
              <div className="review-actions">
                {!['published', 'superseded'].includes(selection.status) && (
                  <>
                    <button className="secondary-button" disabled={busy} onClick={validate}>
                      <Check size={16} /> Validate & prepare preview
                    </button>
                    {preview && (
                      <button className="secondary-button" onClick={() => setViewPreview(true)}>
                        <Eye size={16} /> Open spatial preview
                      </button>
                    )}
                    {role === 'owner' && preview && selection.status !== 'approved' && (
                      <>
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={verified}
                            onChange={(e) => setVerified(e.target.checked)}
                          />{' '}
                          I checked every claim, link, attribution, and permission to share.
                        </label>
                        <button
                          className="primary-button"
                          disabled={busy || !verified || !seenPreview}
                          onClick={approve}
                        >
                          Approve this exact revision
                        </button>
                        {!seenPreview && (
                          <small>Open the spatial preview and return before approving.</small>
                        )}
                      </>
                    )}
                    {role === 'owner' && preview && selection.status === 'approved' && (
                      <button className="primary-button" disabled={busy} onClick={publish}>
                        Publish approved revision
                      </button>
                    )}
                    {role === 'agent' && (
                      <p className="notice">
                        Preparation is complete. The owner must review, approve, and publish using
                        their own token.
                      </p>
                    )}
                  </>
                )}
                <button className="text-button" onClick={() => editRevision(selection)}>
                  Use this content in a new draft
                </button>
                {['published', 'superseded'].includes(selection.status) && (
                  <button
                    className="secondary-button"
                    disabled={busy}
                    onClick={() =>
                      action(async () => {
                        const result = await api<Revision>(
                          `/admin/revisions/${selection.id}/rollback`,
                          'POST',
                          {},
                        );
                        select(result);
                        await refresh();
                        setNotice(
                          'A rollback draft was created. Review and approve it before publication.',
                        );
                      })
                    }
                  >
                    Prepare rollback draft
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="index-empty">
              <h1>Ready for the next piece.</h1>
              <p>Select a revision or create a new draft.</p>
              <button className="primary-button" onClick={newPiece}>
                New creation
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
