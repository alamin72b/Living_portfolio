import { z } from 'zod';
export { z };

export const kinds = ['fragment', 'cluster', 'project'] as const;
export const stages = ['blueprint', 'experiment', 'working', 'evolving'] as const;
export const areas = ['general', 'english_communication'] as const;
export const relationTypes = [
  'contains',
  'reuses',
  'depends_on',
  'inspired_by',
  'evolves_from',
] as const;
export const stageLabels = {
  blueprint: 'An idea taking shape',
  experiment: 'An experiment in motion',
  working: 'A working creation',
  evolving: 'Working, still evolving',
};
export const areaLabels = {
  general: 'General workspace',
  english_communication: 'English & Communication',
};
export const relationLabels = {
  contains: 'is made of',
  reuses: 'reuses',
  depends_on: 'depends on',
  inspired_by: 'is inspired by',
  evolves_from: 'evolves from',
};

// No URLs with embedded credentials, fragments, or query tokens. Never fetch these on the server.
export const safeUrl = z
  .string()
  .max(2048)
  .url()
  .refine((value) => {
    try {
      const url = new URL(value);
      return (
        url.protocol === 'https:' &&
        !url.username &&
        !url.password &&
        !url.search &&
        !url.hash &&
        !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
      );
    } catch {
      return false;
    }
  }, 'Use a public HTTPS URL without credentials, query parameters, or a fragment.');
const optionalUrl = z
  .union([safeUrl, z.literal('')])
  .optional()
  .default('');
const text = (max: number) => z.string().trim().max(max);
const calendarDate = z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal('')]).default('');
export const positionSchema = z
  .object({
    x: z.number().finite().min(-100000).max(100000),
    y: z.number().finite().min(-100000).max(100000),
  })
  .strict();
export const evidenceSchema = z
  .object({
    claim: text(500).min(1),
    url: optionalUrl,
    note: text(2000).default(''),
    visibility: z.enum(['private', 'public']).default('private'),
  })
  .strict();
export const mediaSchema = z
  .object({ kind: z.enum(['image', 'video', 'preview']), url: safeUrl, alt: text(300).min(1) })
  .strict();
export const relationshipSchema = z
  .object({ targetId: z.string().uuid(), type: z.enum(relationTypes), note: text(500).default('') })
  .strict();
export const milestoneSchema = z.discriminatedUnion('state', [
  z
    .object({
      state: z.literal('goal'),
      intention: text(500).min(1),
      description: text(1200).default(''),
      target: text(500).default(''),
      targetDate: calendarDate,
    })
    .strict(),
  z
    .object({
      state: z.literal('accomplishment'),
      achievement: text(500).min(1),
      description: text(1200).default(''),
      result: text(500).default(''),
      completedDate: calendarDate,
    })
    .strict(),
]);
export const pieceSchema = z
  .object({
    title: text(100).min(1),
    kind: z.enum(kinds),
    stage: z.enum(stages),
    area: z.enum(areas).default('general'),
    milestone: milestoneSchema.optional(),
    summary: text(280).min(1),
    body: text(12000).default(''),
    technologies: z.array(text(40).min(1)).max(20).default([]),
    repositoryUrl: optionalUrl,
    liveUrl: optionalUrl,
    notes: text(6000).default(''),
    attribution: z.enum(['owner', 'ai-infrastructure', 'neutral-demo']).default('owner'),
    position: positionSchema,
    evidence: z.array(evidenceSchema).max(30).default([]),
    media: z.array(mediaSchema).max(12).default([]),
    relationships: z.array(relationshipSchema).max(50).default([]),
  })
  .strict()
  .superRefine((piece, context) => {
    if (piece.milestone) {
      if (piece.area !== 'english_communication')
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['area'],
          message: 'Goals and accomplishments belong to the English & Communication area.',
        });
      if (piece.milestone.state === 'goal' && piece.stage !== 'blueprint')
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['stage'],
          message: 'An English goal must remain a blueprint until it is accomplished.',
        });
      if (
        piece.milestone.state === 'accomplishment' &&
        piece.stage !== 'working' &&
        piece.stage !== 'evolving'
      )
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['stage'],
          message: 'An English accomplishment must use a realized working or evolving stage.',
        });
    } else if (piece.evidence.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['evidence'],
        message: 'A creation needs at least one evidence claim.',
      });
    }
  });
export const profileSchema = z
  .object({
    name: text(100).min(1),
    headline: text(200).min(1),
    introduction: text(1200).min(1),
    email: z.union([z.string().email().max(254), z.literal('')]).default(''),
    githubUrl: optionalUrl,
  })
  .strict();
export const draftSchema = z.discriminatedUnion('entityType', [
  z
    .object({
      entityType: z.literal('piece'),
      pieceId: z.string().uuid().optional(),
      baseRevisionId: z.string().uuid().nullable().default(null),
      content: pieceSchema,
    })
    .strict(),
  z
    .object({
      entityType: z.literal('profile'),
      baseRevisionId: z.string().uuid().nullable().default(null),
      content: profileSchema,
    })
    .strict(),
]);
export const approvalSchema = z
  .object({ digest: z.string().regex(/^[a-f0-9]{64}$/), verified: z.literal(true) })
  .strict();
export const publishSchema = z.object({ digest: z.string().regex(/^[a-f0-9]{64}$/) }).strict();
export const ingestionSchema = z
  .object({
    title: text(100).default(''),
    summary: text(280).default(''),
    repositoryUrl: optionalUrl,
    evidenceNote: text(2000).default(''),
    kind: z.enum(kinds).default('fragment'),
    stage: z.enum(stages).default('experiment'),
    area: z.enum(areas).default('general'),
    milestone: milestoneSchema.optional(),
  })
  .strict()
  .superRefine((input, context) => {
    if (!input.milestone && !input.title)
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['title'],
        message: 'Title is required.',
      });
    if (!input.milestone && !input.summary)
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['summary'],
        message: 'Summary is required for a creation.',
      });
    if (!input.milestone && !input.repositoryUrl)
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['repositoryUrl'],
        message: 'A repository URL is required for creation ingestion.',
      });
    if (!input.milestone && !input.evidenceNote)
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['evidenceNote'],
        message: 'Evidence notes are required for creation ingestion.',
      });
    if (input.milestone && input.area !== 'english_communication')
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['area'],
        message: 'Goals and accomplishments belong to the English & Communication area.',
      });
  });

export type PieceContent = z.infer<typeof pieceSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type DraftInput = z.infer<typeof draftSchema>;
export type RelationType = (typeof relationTypes)[number];
export type Piece = PieceContent & { id: string; revisionId: string; revisionNumber: number };
export type Connection = {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationType;
  note: string;
};
export type Workspace = {
  version: number;
  profile: Profile;
  profileRevisionId: string | null;
  pieces: Piece[];
  connections: Connection[];
  previewOrigins: string[];
};
export type DraftState = 'draft' | 'validated' | 'approved' | 'published' | 'superseded';
export type Revision = {
  id: string;
  entityType: 'piece' | 'profile';
  entityId: string;
  number: number;
  baseRevisionId: string | null;
  content: PieceContent | Profile;
  status: DraftState;
  createdAt: string;
  createdBy: 'owner' | 'agent';
  approvalDigest: string | null;
};
export type Preview = {
  revision: Revision;
  workspace: Workspace;
  digest: string;
  warnings: string[];
};
export type AgentProposal = {
  draft: DraftInput;
  reviewNotes: string[];
  inspectedRepository: false;
};
export type Milestone = NonNullable<PieceContent['milestone']>;
export interface ContentPreparationProvider {
  prepare(input: z.infer<typeof ingestionSchema>, workspace: Workspace): Promise<AgentProposal>;
}

export const defaultProfile: Profile = {
  name: 'MD Al Amin Bhuiyan',
  headline: 'Small beginnings. Connected possibilities.',
  introduction:
    'I’m rebuilding my programming skills, one creation at a time. This workspace will hold the things I actually make — and the connections between them.',
  email: '',
  githubUrl: '',
};
export const emptyWorkspace: Workspace = {
  version: 0,
  profile: defaultProfile,
  profileRevisionId: null,
  pieces: [],
  connections: [],
  previewOrigins: [],
};

export function publicPiece(piece: Piece): Piece {
  return {
    ...piece,
    evidence: piece.evidence
      .filter((e) => e.visibility === 'public')
      .map((e) => ({ ...e, note: '' })),
  };
}
export function graphErrors(
  pieces: Pick<Piece, 'id' | 'kind'>[],
  connections: Connection[],
): string[] {
  const errors: string[] = [];
  const ids = new Set(pieces.map((p) => p.id));
  const seen = new Set<string>();
  for (const edge of connections) {
    if (!ids.has(edge.sourceId) || !ids.has(edge.targetId))
      errors.push('Every relationship must point to a published piece.');
    if (edge.sourceId === edge.targetId) errors.push('A piece cannot refer to itself.');
    const key = `${edge.sourceId}:${edge.targetId}:${edge.type}`;
    if (seen.has(key)) errors.push('Duplicate relationships are not allowed.');
    seen.add(key);
    if (edge.type === 'contains' && pieces.find((p) => p.id === edge.sourceId)?.kind === 'fragment')
      errors.push('Only a cluster or project can contain pieces.');
  }
  // Composition, reuse, dependency, and evolution share one DAG. Inspiration may be cyclic.
  const adjacency = new Map<string, string[]>();
  for (const e of connections.filter((e) => e.type !== 'inspired_by'))
    adjacency.set(e.sourceId, [...(adjacency.get(e.sourceId) ?? []), e.targetId]);
  const visited = new Set<string>();
  const active = new Set<string>();
  function cycle(id: string): boolean {
    if (active.has(id)) return true;
    if (visited.has(id)) return false;
    active.add(id);
    for (const child of adjacency.get(id) ?? []) {
      if (cycle(child)) return true;
    }
    active.delete(id);
    visited.add(id);
    return false;
  }
  if ([...ids].some(cycle))
    errors.push('Composition, reuse, dependency, and evolution must not form a cycle.');
  return [...new Set(errors)];
}
export function contentWarnings(content: PieceContent): string[] {
  const warnings: string[] = [];
  if (content.attribution === 'neutral-demo')
    warnings.push('Neutral demonstration content must not be presented as an owner achievement.');
  if (content.milestone && content.evidence.length === 0)
    warnings.push(
      'No supporting material was supplied. This will be an owner-attested milestone, not an independently verified result.',
    );
  else if (content.evidence.every((e) => !e.url))
    warnings.push('Evidence has no link. Review the supplied notes and original work directly.');
  if (content.evidence.some((e) => e.visibility === 'public'))
    warnings.push('Public evidence claims and URLs will be visible to visitors.');
  if (content.media.some((m) => m.kind === 'preview'))
    warnings.push(
      'An iframe works only when its exact origin is allowlisted and the destination permits framing.',
    );
  return warnings;
}
export function hasLikelySecret(value: unknown): boolean {
  return /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:ghp_|github_pat_|sk_live_|sk-proj-)[A-Za-z0-9_-]{16,}|\bAKIA[A-Z0-9]{16}\b/.test(
    JSON.stringify(value),
  );
}
export function descendants(id: string, connections: Connection[]): Set<string> {
  const result = new Set<string>();
  const queue = [id];
  while (queue.length) {
    const current = queue.shift()!;
    for (const edge of connections) {
      if (
        edge.sourceId === current &&
        edge.type === 'contains' &&
        !result.has(edge.targetId) &&
        edge.targetId !== id
      ) {
        result.add(edge.targetId);
        queue.push(edge.targetId);
      }
    }
  }
  return result;
}

export const positionSpacing = { x: 360, y: 300 } as const;

export function positionsOverlap(
  position: { x: number; y: number },
  other: { x: number; y: number },
): boolean {
  return (
    Math.abs(position.x - other.x) < positionSpacing.x &&
    Math.abs(position.y - other.y) < positionSpacing.y
  );
}

export function positionConflicts(
  position: { x: number; y: number },
  occupied: Array<{ x: number; y: number }>,
): boolean {
  return occupied.some((other) => positionsOverlap(position, other));
}

export function recommendPosition(workspace: Workspace): { x: number; y: number } {
  const occupied = workspace.pieces.map((p) => p.position);
  for (let row = 0; row < 100; row++) {
    for (let col = 0; col < 8; col++) {
      const point = { x: 560 + col * positionSpacing.x, y: row * positionSpacing.y };
      if (!positionConflicts(point, occupied)) return point;
    }
  }
  return { x: 560, y: 30000 };
}

export function milestoneLabel(milestone: Milestone): string {
  return milestone.state === 'goal' ? milestone.intention : milestone.achievement;
}

export function milestoneSummary(milestone: Milestone): string {
  if (milestone.description) return milestone.description;
  return milestone.state === 'goal'
    ? `Goal: ${milestone.intention}`
    : `Accomplishment: ${milestone.achievement}`;
}

const sampleIds = [
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000004',
];
function sample(
  index: number,
  title: string,
  kind: PieceContent['kind'],
  stage: PieceContent['stage'],
  summary: string,
  x: number,
  y: number,
): Piece {
  return {
    id: sampleIds[index],
    revisionId: sampleIds[index],
    revisionNumber: 1,
    title,
    kind,
    stage,
    area: 'general',
    summary,
    body: 'This is neutral demonstration content. It illustrates the portfolio’s interface and is not an achievement, repository, or application created by the owner.',
    technologies: [],
    repositoryUrl: '',
    liveUrl: '',
    notes: 'Use the assembly control to see how independent pieces can form a larger creation.',
    attribution: 'neutral-demo',
    position: { x, y },
    evidence: [
      {
        claim: 'Interface demonstration only.',
        url: '',
        note: 'Not an owner achievement.',
        visibility: 'public',
      },
    ],
    media: [],
    relationships: [],
  };
}
export const sampleWorkspace: Workspace = {
  ...emptyWorkspace,
  pieces: [
    sample(
      0,
      'A small interaction',
      'fragment',
      'blueprint',
      'Every working thing starts with a question.',
      590,
      -90,
    ),
    sample(
      1,
      'A useful behavior',
      'fragment',
      'experiment',
      'An independent piece, finding its form.',
      590,
      245,
    ),
    sample(
      2,
      'A working component',
      'fragment',
      'working',
      'One small thing that can stand on its own.',
      1000,
      300,
    ),
    sample(
      3,
      'Something greater',
      'project',
      'evolving',
      'Independent pieces. A shared possibility.',
      1030,
      -80,
    ),
  ],
  connections: [
    {
      id: 'sample-edge-1',
      sourceId: sampleIds[3],
      targetId: sampleIds[0],
      type: 'contains',
      note: 'Example composition',
    },
    {
      id: 'sample-edge-2',
      sourceId: sampleIds[3],
      targetId: sampleIds[1],
      type: 'contains',
      note: 'Example composition',
    },
    {
      id: 'sample-edge-3',
      sourceId: sampleIds[3],
      targetId: sampleIds[2],
      type: 'contains',
      note: 'Example composition',
    },
  ],
};
