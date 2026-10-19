import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  MiniMap,
  useReactFlow,
  type Node,
  type Edge,
  type Viewport,
} from '@xyflow/react';
import { useReducedMotion } from 'motion/react';
import {
  ArrowUpRight,
  Compass,
  Search,
  Minus,
  Plus,
  Maximize,
  Home,
  HelpCircle,
  X,
  RotateCcw,
} from 'lucide-react';
import { descendants, type Workspace as WorkspaceData } from '@blueprint/shared';
import { PieceNode, type PieceFlowNode } from './PieceNode';
import { IdentityNode, type IdentityFlowNode } from './IdentityNode';
import { BlueprintGlyph } from './BlueprintGlyph';
import { IndexPanel } from './IndexPanel';
import { DetailPanel } from './DetailPanel';
import { Dialog } from './Dialog';
import { arrangedPositions } from '../graph';
type Props = {
  data: WorkspaceData;
  mode: 'live' | 'sample' | 'preview';
  status?: 'loading' | 'ready' | 'offline';
  onSample?: () => void;
  onRetry?: () => void;
  onManage?: () => void;
  onClose?: () => void;
};
const nodeTypes = {
  piece: PieceNode,
  identity: IdentityNode,
  ghost: () => (
    <div className="ghost-node">
      <div className="ghost-top">
        <span>FIG. 00</span>
        <span>UNBUILT / UNBOUNDED</span>
      </div>
      <BlueprintGlyph />
      <h2>
        A little space
        <br />
        for the next thing.
      </h2>
      <p>
        An idea. A few lines of code.
        <br />
        Something that works.
      </p>
      <div className="ghost-dimension">THE POSSIBILITIES ARE OPEN</div>
    </div>
  ),
};
export function Workspace(props: Props) {
  return (
    <ReactFlowProvider>
      <WorkspaceInner {...props} />
    </ReactFlowProvider>
  );
}
function WorkspaceInner({
  data,
  mode,
  status = 'ready',
  onSample = () => {},
  onRetry = () => {},
  onManage = () => {},
  onClose,
}: Props) {
  const flow = useReactFlow();
  const reduce = useReducedMotion();
  const duration = reduce ? 0 : 550;
  const [selected, setSelected] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [panel, setPanel] = useState<'index' | 'help' | 'contact' | null>(null);
  const [zoom, setZoom] = useState(1);
  const [transformed, setTransformed] = useState(false);
  const previousViewport = useRef<Viewport | null>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const open = useCallback((id: string) => {
    setPanel(null);
    setSelected(id);
  }, []);
  const expand = useCallback(
    (id: string) => {
      setExpanded((current) => {
        if (current === id) {
          if (previousViewport.current)
            void flow.setViewport(previousViewport.current, { duration });
          return null;
        }
        previousViewport.current = flow.getViewport();
        return id;
      });
    },
    [flow, duration],
  );
  const related = useMemo(
    () =>
      selected
        ? new Set([
            selected,
            ...data.connections
              .filter((e) => e.sourceId === selected || e.targetId === selected)
              .flatMap((e) => [e.sourceId, e.targetId]),
          ])
        : new Set<string>(),
    [data.connections, selected],
  );
  const positions = useMemo(() => arrangedPositions(data, expanded), [data, expanded]);
  const nodes = useMemo<Array<PieceFlowNode | IdentityFlowNode | Node>>(
    () => [
      {
        id: 'identity',
        type: 'identity',
        position: { x: 0, y: -20 },
        data: {
          profile: data.profile,
          empty: !data.pieces.length,
          sample: mode === 'sample',
          onSample,
          onIndex: () => setPanel('index'),
        },
        draggable: false,
        selectable: false,
        focusable: false,
      },
      ...(!data.pieces.length
        ? [
            {
              id: 'beginning',
              type: 'ghost',
              position: { x: 590, y: 35 },
              data: {},
              draggable: false,
              selectable: false,
              focusable: false,
            },
          ]
        : []),
      ...data.pieces.map((piece) => ({
        id: piece.id,
        type: 'piece' as const,
        position: positions.get(piece.id)!,
        data: {
          piece: transformed && mode === 'sample' ? { ...piece, stage: 'working' as const } : piece,
          onOpen: open,
          onExpand: expand,
          expanded: expanded === piece.id,
          componentCount: descendants(piece.id, data.connections).size,
          highlight: related.has(piece.id),
        },
        ariaLabel: `${piece.title}, ${piece.milestone?.state ?? piece.kind}, ${piece.stage}`,
        selected: selected === piece.id,
        draggable: false,
      })),
    ],
    [data, mode, onSample, open, expand, expanded, positions, related, selected, transformed],
  );
  const edges = useMemo<Edge[]>(
    () =>
      data.connections.map((e) => ({
        id: e.id,
        source: e.sourceId,
        target: e.targetId,
        type: 'smoothstep',
        label:
          selected === e.sourceId || selected === e.targetId || expanded === e.sourceId
            ? e.type.replaceAll('_', ' ')
            : undefined,
        animated: false,
        className:
          (related.has(e.sourceId) && related.has(e.targetId)) || expanded === e.sourceId
            ? 'connection-active'
            : '',
        style: {
          stroke: e.type === 'contains' ? '#7d9483' : '#9ba8a1',
          strokeWidth: e.type === 'contains' ? 1.6 : 1,
          strokeDasharray: e.type === 'inspired_by' ? '3 6' : undefined,
        },
        labelStyle: { fontFamily: 'DM Sans', fontSize: 11, fill: '#374b3d' },
        labelBgStyle: { fill: '#f4f1e9', fillOpacity: 0.95 },
        ariaLabel: `${data.pieces.find((p) => p.id === e.sourceId)?.title} ${e.type} ${data.pieces.find((p) => p.id === e.targetId)?.title}`,
      })),
    [data, related, expanded, selected],
  );
  const fit = useCallback(() => {
    void flow.fitView({ padding: 0.12, duration, maxZoom: 1, minZoom: 0.25 });
  }, [flow, duration]);
  const home = useCallback(() => {
    setSelected(null);
    setExpanded(null);
    void flow.fitView({
      nodes: [{ id: 'identity' }, { id: 'beginning' }],
      padding: 0.14,
      maxZoom: window.innerWidth < 700 ? 0.7 : 1,
      duration,
    });
  }, [flow, duration]);
  useEffect(() => {
    if (expanded) {
      const timer = setTimeout(
        () =>
          void flow.fitView({
            nodes: [...descendants(expanded, data.connections), expanded].map((id) => ({ id })),
            padding: 0.25,
            maxZoom: 0.9,
            duration,
          }),
        40,
      );
      return () => clearTimeout(timer);
    }
  }, [expanded, data.connections, flow, duration]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('input,textarea,select,dialog,[contenteditable]')) return;
      if (event.key === '/') {
        event.preventDefault();
        setPanel('index');
      } else if (event.key === '?') setPanel('help');
      else if (event.key === '0') fit();
      else if (event.key === 'Home') {
        event.preventDefault();
        home();
      } else if (event.key === '+' || event.key === '=') void flow.zoomIn({ duration });
      else if (event.key === '-') void flow.zoomOut({ duration });
      else if (event.key === 'Escape') {
        setPanel(null);
        setSelected(null);
      } else if (event.key.startsWith('Arrow') && workspaceRef.current?.contains(target)) {
        event.preventDefault();
        const v = flow.getViewport();
        void flow.setViewport(
          {
            ...v,
            x: v.x + (event.key === 'ArrowLeft' ? 70 : event.key === 'ArrowRight' ? -70 : 0),
            y: v.y + (event.key === 'ArrowUp' ? 70 : event.key === 'ArrowDown' ? -70 : 0),
          },
          { duration: reduce ? 0 : 100 },
        );
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [flow, fit, home, duration, reduce]);
  const chosen = data.pieces.find((p) => p.id === selected);
  return (
    <main className={`workspace mode-${mode}`}>
      <a
        className="skip-link"
        href="#workspace-index"
        onClick={(e) => {
          e.preventDefault();
          setPanel('index');
        }}
      >
        Skip canvas and open accessible index
      </a>
      <header className="site-header">
        <button className="brand" onClick={home} aria-label="Return to workspace origin">
          <span className="brand-mark">
            <span />
          </span>
          <span>
            THE LIVING
            <br />
            <strong>BLUEPRINT</strong>
          </span>
        </button>
        <div className="header-center">
          <span className="status-dot" /> AN OPEN WORKSPACE<span className="header-divider">/</span>
          <span>{mode === 'sample' ? 'ILLUSTRATIVE EXAMPLE' : data.profile.name}</span>
        </div>
        <nav aria-label="Workspace tools">
          <button onClick={() => setPanel('index')}>
            <Search size={17} />
            <span>Index</span>
            <kbd>/</kbd>
          </button>
          <button className="contact-button" onClick={() => setPanel('contact')}>
            <span>Say hello</span>
            <ArrowUpRight size={16} />
          </button>
        </nav>
      </header>
      {mode !== 'live' && (
        <div className="mode-banner">
          <span>
            {mode === 'sample'
              ? 'SAMPLE WORKSPACE · Demonstration only, not my achievements'
              : 'PRIVATE PREVIEW · These changes are not public'}
          </span>
          <button onClick={mode === 'sample' ? onSample : onClose}>
            <span>{mode === 'sample' ? 'Back to my workspace' : 'Back to review'}</span>
            <X size={15} />
          </button>
        </div>
      )}
      {status === 'offline' && mode === 'live' && (
        <div className="offline-notice" role="status">
          The content service is unavailable. <button onClick={onRetry}>Retry</button>
          <button onClick={onSample}>Explore an example ↗</button>
        </div>
      )}
      {status === 'loading' && mode === 'live' && (
        <div className="offline-notice" role="status">
          Opening the workspace…
        </div>
      )}
      <div
        className="canvas-surface"
        ref={workspaceRef}
        tabIndex={0}
        role="region"
        aria-label="Infinite workspace. Drag to pan, scroll to zoom, or press slash to open the accessible index."
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.12, maxZoom: 1 }}
          minZoom={0.18}
          maxZoom={2}
          nodesDraggable={false}
          nodesConnectable={false}
          edgesReconnectable={false}
          elementsSelectable
          nodesFocusable
          edgesFocusable
          deleteKeyCode={null}
          panOnDrag
          zoomOnScroll
          zoomOnPinch
          panOnScroll={false}
          zoomOnDoubleClick={false}
          onlyRenderVisibleElements
          onNodeClick={(_, node) => {
            if (node.type === 'piece') open(node.id);
          }}
          onPaneClick={() => setSelected(null)}
          onMove={(_, view) => setZoom(view.zoom)}
          onMoveEnd={(_, view) => {
            try {
              if (mode === 'live')
                localStorage.setItem('blueprint-viewport-v1', JSON.stringify(view));
            } catch {
              /* private browsing may block storage */
            }
          }}
          onInit={(instance) => {
            if (mode === 'live') {
              try {
                const raw = localStorage.getItem('blueprint-viewport-v1');
                if (raw) {
                  const v = JSON.parse(raw);
                  if ([v.x, v.y, v.zoom].every(Number.isFinite) && v.zoom >= 0.18 && v.zoom <= 2)
                    void instance.setViewport(v);
                }
              } catch {
                /* invalid preferences never block the canvas */
              }
            }
          }}
        >
          <Background
            id="grid"
            variant={BackgroundVariant.Lines}
            color="#d6d9cf"
            gap={32}
            lineWidth={0.5}
          />
          <MiniMap
            className="workspace-minimap"
            pannable
            zoomable
            nodeColor={(n) => (n.type === 'piece' ? '#849b7c' : '#d8dbd1')}
            maskColor="rgba(244,241,233,.65)"
            ariaLabel="Workspace overview map"
          />
        </ReactFlow>
      </div>
      <div className="canvas-note">
        <span className="little-cross" /> {String(data.pieces.length).padStart(2, '0')}{' '}
        {mode === 'sample' ? 'EXAMPLE PIECES' : 'PUBLISHED PIECES'}
        <span className="muted">/ room to grow</span>
      </div>
      <footer className="workspace-footer">
        <div className="legend" aria-label="Visual states">
          <span>
            <i className="legend-outline" /> Blueprint
          </span>
          <span>
            <i className="legend-hatch" /> Experiment
          </span>
          <span>
            <i className="legend-solid" /> Realized
          </span>
        </div>
        <div className="canvas-controls" aria-label="Canvas navigation">
          <button onClick={() => flow.zoomOut({ duration })} aria-label="Zoom out">
            <Minus size={17} />
          </button>
          <output aria-label="Zoom level">{Math.round(zoom * 100)}%</output>
          <button onClick={() => flow.zoomIn({ duration })} aria-label="Zoom in">
            <Plus size={17} />
          </button>
          <span className="control-separator" />
          <button onClick={fit} aria-label="Fit all content" title="Fit all content (0)">
            <Maximize size={17} />
          </button>
          <button onClick={home} aria-label="Return to origin" title="Return to origin (Home)">
            <Home size={17} />
          </button>
          <button onClick={() => setPanel('help')} aria-label="Navigation help">
            <HelpCircle size={17} />
          </button>
        </div>
        <div className="footer-right">
          {mode === 'sample' ? (
            <button onClick={() => setTransformed((v) => !v)}>
              <RotateCcw size={14} />
              {transformed ? 'Restore actual sample stages' : 'Try blueprint → reality'}
            </button>
          ) : (
            <button onClick={onSample}>
              Explore an example <ArrowUpRight size={14} />
            </button>
          )}
          <button className="manage-link" onClick={onManage} disabled={mode === 'preview'}>
            AI-built space · Genuine work only
          </button>
        </div>
      </footer>
      {panel === 'index' && (
        <IndexPanel
          data={data}
          onClose={() => setPanel(null)}
          onSelect={(id) => {
            open(id);
            const p = positions.get(id);
            if (p) void flow.setCenter(p.x + 145, p.y + 120, { zoom: 1, duration });
          }}
        />
      )}
      {chosen && !panel && (
        <DetailPanel
          key={chosen.id}
          piece={chosen}
          data={data}
          expanded={expanded === chosen.id}
          onClose={() => setSelected(null)}
          onSelect={open}
          onExpand={() => {
            expand(chosen.id);
            setSelected(null);
          }}
        />
      )}
      {panel === 'help' && (
        <Dialog title="Finding your way" onClose={() => setPanel(null)}>
          <Compass size={32} />
          <h2>
            A space to
            <br />
            <em>follow your curiosity.</em>
          </h2>
          <p>
            Each object is a creation. Lines describe an explicit relationship. A piece can belong
            to something bigger and remain a creation of its own.
          </p>
          <dl className="shortcut-list">
            <div>
              <dt>Explore</dt>
              <dd>Drag empty space. On touch screens, drag with one finger.</dd>
            </div>
            <div>
              <dt>Zoom</dt>
              <dd>Scroll, pinch with two fingers, or use + and −.</dd>
            </div>
            <div>
              <dt>Inspect</dt>
              <dd>Select a creation, or use Tab and Enter.</dd>
            </div>
            <div>
              <dt>Unfold</dt>
              <dd>
                Select the expand control on a cluster or project. Select again to reassemble.
              </dd>
            </div>
            <div>
              <dt>Navigate by keyboard</dt>
              <dd>
                Focus the canvas and use arrow keys. Home returns to the origin. 0 fits all pieces.
              </dd>
            </div>
            <div>
              <dt>Find a piece</dt>
              <dd>Press / or open Index. All content is available without spatial navigation.</dd>
            </div>
          </dl>
          <p className="notice">
            Stages describe the actual work. They are not a required sequence. This interface
            respects your device’s reduced-motion preference.
          </p>
        </Dialog>
      )}
      {panel === 'contact' && (
        <Dialog title="The person behind the pieces" onClose={() => setPanel(null)}>
          <span className="signature large">Al Amin.</span>
          <h2>{data.profile.name}</h2>
          <p className="lead">{data.profile.headline}</p>
          <p>{data.profile.introduction}</p>
          <div className="detail-links">
            {data.profile.email && (
              <a href={`mailto:${data.profile.email}`}>
                Send an email <ArrowUpRight size={16} />
              </a>
            )}
            {data.profile.githubUrl && (
              <a href={data.profile.githubUrl} target="_blank" rel="noopener noreferrer">
                GitHub <ArrowUpRight size={16} />
              </a>
            )}
          </div>
          {!data.profile.email && !data.profile.githubUrl && (
            <p className="notice">Contact details haven’t been published yet.</p>
          )}
          <p className="muted">
            The portfolio infrastructure is built with AI. Creations attributed to me represent my
            own work.
          </p>
        </Dialog>
      )}
    </main>
  );
}
