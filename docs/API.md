# API reference map

Base path: `/api/v1`. Development Swagger: `/api/docs`. OpenAPI JSON: `/api/docs-json`. Request schemas are generated from the shared Zod definitions. Production Compose disables Swagger.

## Public reads

| Method/path         | Result                                                                                             |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| GET `/workspace`    | Consistent published profile, pieces, connections, positions, allowed preview origins, and version |
| GET `/profile`      | Published profile or honest initial introduction                                                   |
| GET `/pieces/:id`   | One published piece, redacted public evidence                                                      |
| GET `/health`       | Process liveness                                                                                   |
| GET `/health/ready` | Database/schema readiness                                                                          |

## Private operations

Send `Authorization: Bearer <token>`. Do not put tokens into URLs. Agent tokens can prepare content; owner tokens can also approve and publish.

| Method/path                               | Roles        | Purpose                                                             |
| ----------------------------------------- | ------------ | ------------------------------------------------------------------- |
| GET `/admin/session`                      | Agent, owner | Identify credential role without returning the token                |
| GET `/admin/workspace`                    | Agent, owner | Full published state including private review evidence              |
| GET `/admin/revisions?limit=100&offset=0` | Agent, owner | Revision history, max 200 per request                               |
| GET `/admin/revisions/:id`                | Agent, owner | Full private revision                                               |
| GET `/admin/pieces/:id`                   | Agent, owner | Complete current revision for safe updates                          |
| GET `/admin/audit`                        | Owner        | Latest 200 workflow audit entries                                   |
| POST `/admin/ingestions`                  | Agent, owner | Prepare proposal from supplied facts; does not fetch the repo       |
| POST `/admin/drafts`                      | Agent, owner | Create an immutable draft                                           |
| POST `/admin/revisions/:id/validate`      | Agent, owner | Check base, graph, content; body `{}`                               |
| GET `/admin/revisions/:id/preview`        | Agent, owner | Private projected workspace and exact digest; records preview event |
| POST `/admin/revisions/:id/approve`       | Owner        | Body `{digest, verified: true}`                                     |
| POST `/admin/revisions/:id/publish`       | Owner        | Body `{digest}`; atomic publication                                 |
| POST `/admin/revisions/:id/rollback`      | Agent, owner | Body `{}`; prepare a new rollback draft                             |

The preview GET records audit/workflow metadata but does not change published content. It is authenticated and responses are `Cache-Control: no-store`.

Draft bodies are discriminated by `entityType`. A new piece sends `entityType: "piece"`, `baseRevisionId: null`, and complete `content`. Updates also send the existing `pieceId` and current base revision. A profile sends `entityType: "profile"`, current profile base revision or null, and the profile content. Examples live in `examples/`.

Piece content may include `area: "english_communication"` and a `milestone`. A goal milestone has `state: "goal"`, `intention`, and optional `description`, `target`, and `targetDate`; an accomplishment has `state: "accomplishment"`, `achievement`, and optional `description`, `result`, and `completedDate`. Milestones require blueprint/realized stages respectively, and their evidence list may be empty. A goal-to-accomplishment update must reuse the existing `pieceId` and current `baseRevisionId`; publication preserves its position, connections, and history.

Approval and publication must happen after independent owner verification. A fingerprint is not factual verification. Any intervening publication changes the workspace version and invalidates the old preview digest.

## Errors and constraints

Errors contain `statusCode`, `message`, and `requestId`; validation errors additionally provide safe `issues` with field paths and messages. No values/tokens are echoed. All public and private responses are uncached by default.

Limits: 256KB request body; 1,000 piece identities; 100-character title; 280-character summary; 12,000-character body; 20 technology labels; 30 evidence records; 12 media records; 50 outgoing relationships. Strict schemas reject unknown properties. The default request limiter allows 300 requests per minute per instance/tracked client; token-check requests have a tighter 10/minute limit. Rate state is in memory, so multi-instance deployments need a shared strategy.

Public media/URL fields require HTTPS without query strings, fragments, or embedded credentials. UUID parameters are validated. Relationship integrity includes existing published endpoints, self/duplicate prevention, container kind, and structural-cycle checks. Profile changes are revisioned exactly like piece changes.
