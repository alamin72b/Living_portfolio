import { Inject, Injectable } from '@nestjs/common';
import {
  ingestionSchema,
  milestoneLabel,
  milestoneSummary,
  recommendPosition,
  type AgentProposal,
  type ContentPreparationProvider,
  type Workspace,
  type z,
} from '@blueprint/shared';
export const PREPARATION_PROVIDER = Symbol('PREPARATION_PROVIDER');
// Deliberately deterministic. No model, repository fetch, or code execution is disguised as AI.
export class EvidenceOnlyProvider implements ContentPreparationProvider {
  async prepare(
    input: z.infer<typeof ingestionSchema>,
    workspace: Workspace,
  ): Promise<AgentProposal> {
    const milestone = input.milestone;
    const title = (milestone ? milestoneLabel(milestone) : input.title).slice(0, 100);
    const summary = (milestone ? milestoneSummary(milestone) : input.summary).slice(0, 280);
    return {
      inspectedRepository: false,
      reviewNotes: [
        milestone
          ? 'Only the supplied English & Communication milestone fields were used.'
          : 'Only the supplied title, description, URL, and evidence note were used.',
        'The repository has not been fetched, inspected, or executed. Ask an authorized external coding agent to inspect it.',
        'No relationships or technology claims have been inferred. Owner verification is required.',
        ...(milestone && !input.evidenceNote
          ? [
              'No supporting material was supplied; the milestone remains owner-attested, not independently verified.',
            ]
          : []),
      ],
      draft: {
        entityType: 'piece',
        baseRevisionId: null,
        content: {
          title,
          kind: milestone ? 'fragment' : input.kind,
          stage: milestone ? (milestone.state === 'goal' ? 'blueprint' : 'working') : input.stage,
          area: input.area,
          milestone,
          summary,
          body: milestone?.description ?? '',
          technologies: [],
          repositoryUrl: input.repositoryUrl,
          liveUrl: '',
          notes: '',
          attribution: 'owner',
          position: recommendPosition(workspace),
          media: [],
          relationships: [],
          evidence: milestone
            ? []
            : [
                {
                  claim: input.summary,
                  url: input.repositoryUrl,
                  note: input.evidenceNote,
                  visibility: 'private',
                },
              ],
        },
      },
    };
  }
}
@Injectable()
export class PreparationService {
  constructor(
    @Inject(PREPARATION_PROVIDER) private readonly provider: ContentPreparationProvider,
  ) {}
  prepare(input: z.infer<typeof ingestionSchema>, workspace: Workspace) {
    return this.provider.prepare(input, workspace);
  }
}
