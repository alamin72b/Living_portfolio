import { Inject, Injectable } from '@nestjs/common';
import {
  ingestionSchema,
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
    return {
      inspectedRepository: false,
      reviewNotes: [
        'Only the supplied title, description, URL, and evidence note were used.',
        'The repository has not been fetched, inspected, or executed. Ask an authorized external coding agent to inspect it.',
        'No relationships or technology claims have been inferred. Owner verification is required.',
      ],
      draft: {
        entityType: 'piece',
        baseRevisionId: null,
        content: {
          title: input.title,
          kind: input.kind,
          stage: input.stage,
          summary: input.summary,
          body: '',
          technologies: [],
          repositoryUrl: input.repositoryUrl,
          liveUrl: '',
          notes: '',
          attribution: 'owner',
          position: recommendPosition(workspace),
          media: [],
          relationships: [],
          evidence: [
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
