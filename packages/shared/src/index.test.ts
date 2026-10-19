import { describe, it, expect } from 'vitest';
import {
  graphErrors,
  sampleWorkspace,
  descendants,
  safeUrl,
  pieceSchema,
  publicPiece,
  hasLikelySecret,
  recommendPosition,
  contentWarnings,
} from './index.js';
describe('Portfolio contracts and graph integrity', () => {
  it('accepts neutral samples without turning them into owner work', () => {
    for (const p of sampleWorkspace.pieces) {
      const { id: _id, revisionId: _revisionId, revisionNumber: _revisionNumber, ...content } = p;
      expect(pieceSchema.parse(content).attribution).toBe('neutral-demo');
    }
  });
  it('preserves all independently identified components', () => {
    expect(descendants(sampleWorkspace.pieces[3].id, sampleWorkspace.connections).size).toBe(3);
    expect(graphErrors(sampleWorkspace.pieces, sampleWorkspace.connections)).toEqual([]);
  });
  it('rejects missing endpoints and self references', () => {
    const p = sampleWorkspace.pieces[0];
    expect(
      graphErrors([p], [{ id: 'x', sourceId: p.id, targetId: 'missing', type: 'reuses', note: '' }])
        .length,
    ).toBeGreaterThan(0);
    expect(
      graphErrors([p], [{ id: 'x', sourceId: p.id, targetId: p.id, type: 'reuses', note: '' }])
        .length,
    ).toBeGreaterThan(0);
  });
  it('detects cycles across dependency and composition', () => {
    const ps = sampleWorkspace.pieces;
    expect(
      graphErrors(ps, [
        ...sampleWorkspace.connections,
        { id: 'cycle', sourceId: ps[0].id, targetId: ps[3].id, type: 'depends_on', note: '' },
      ]).join(' '),
    ).toContain('cycle');
  });
  it('allows mutual inspiration', () => {
    const [a, b] = sampleWorkspace.pieces;
    expect(
      graphErrors(
        [a, b],
        [
          { id: 'a', sourceId: a.id, targetId: b.id, type: 'inspired_by', note: '' },
          { id: 'b', sourceId: b.id, targetId: a.id, type: 'inspired_by', note: '' },
        ],
      ),
    ).toEqual([]);
  });
  it('rejects duplicate relationships and fragment containment', () => {
    const edge = { ...sampleWorkspace.connections[0], sourceId: sampleWorkspace.pieces[1].id };
    expect(graphErrors(sampleWorkspace.pieces, [edge, edge])).toHaveLength(2);
  });
  it('blocks unsafe protocols and credentials', () => {
    for (const url of [
      'javascript:alert(1)',
      'http://localhost/a',
      'https://user:pass@example.com',
      'https://example.com?token=secret',
    ])
      expect(safeUrl.safeParse(url).success).toBe(false);
    expect(safeUrl.safeParse('https://example.com/demo').success).toBe(true);
  });
  it('removes private evidence and all review notes from public output', () => {
    const p = {
      ...sampleWorkspace.pieces[0],
      evidence: [
        { claim: 'Hidden', url: '', note: 'secret notes', visibility: 'private' as const },
        { claim: 'Visible', url: '', note: 'also private', visibility: 'public' as const },
      ],
    };
    expect(publicPiece(p).evidence).toEqual([
      { claim: 'Visible', url: '', note: '', visibility: 'public' },
    ]);
  });
  it('flags common credential patterns', () => {
    expect(hasLikelySecret({ body: '-----BEGIN PRIVATE KEY-----' })).toBe(true);
    expect(hasLikelySecret({ body: 'Ordinary description' })).toBe(false);
  });
  it('suggests an unoccupied position', () => {
    const p = recommendPosition(sampleWorkspace);
    expect(
      sampleWorkspace.pieces.every((n) => Math.hypot(n.position.x - p.x, n.position.y - p.y) > 280),
    ).toBe(true);
  });
  it('accepts an English goal without compulsory evidence and keeps the target explicit', () => {
    const {
      id: _id,
      revisionId: _revisionId,
      revisionNumber: _revisionNumber,
      ...base
    } = sampleWorkspace.pieces[0];
    const goal = pieceSchema.parse({
      ...base,
      title: 'Complete an English course',
      summary: 'Goal: Complete an English course',
      area: 'english_communication',
      stage: 'blueprint',
      milestone: {
        state: 'goal',
        intention: 'Complete an English course',
        description: 'Build a stronger foundation for communication.',
        target: 'Finish the selected course honestly.',
        targetDate: '',
      },
      evidence: [],
    });
    expect(goal.evidence).toEqual([]);
    expect(goal.milestone?.state).toBe('goal');
    expect(contentWarnings(goal)).toContain(
      'No supporting material was supplied. This will be an owner-attested milestone, not an independently verified result.',
    );
  });
  it('requires realized stages for accomplishments and preserves exact results', () => {
    const {
      id: _id,
      revisionId: _revisionId,
      revisionNumber: _revisionNumber,
      ...base
    } = sampleWorkspace.pieces[0];
    const accomplishment = pieceSchema.parse({
      ...base,
      title: 'Completed an English course',
      summary: 'Completed an English course.',
      area: 'english_communication',
      stage: 'working',
      milestone: {
        state: 'accomplishment',
        achievement: 'Completed the selected English course.',
        description: '',
        result: 'Completed the final assessment.',
        completedDate: '2026-10-19',
      },
      evidence: [],
    });
    expect(accomplishment.milestone?.state).toBe('accomplishment');
    expect(accomplishment.milestone?.result).toBe('Completed the final assessment.');
    expect(pieceSchema.safeParse({ ...accomplishment, stage: 'blueprint' }).success).toBe(false);
  });
});
