# Project status

## Delivery state

Implemented source release: **1.0.0**, 19 October 2026 (Asia/Dhaka). The English & Communication goal-to-accomplishment feature is implemented on `feature/english-goals-accomplishments` and awaits integration review. No genuine goals or achievements have been supplied; the public collection remains empty. The platform is AI-built infrastructure. A GitHub source remote is configured, but there is no public deployment.

## Implemented

- npm-workspaces monorepo with React/TypeScript/Vite, NestJS, Drizzle/PostgreSQL, shared runtime validation, formatting/linting, and meaningful local Git branches/commits.
- Distinct ivory/charcoal spatial workspace, honest empty state, separate neutral sample mode, blueprint/experiment/working/evolving treatments, SVG realization, and relationship emphasis.
- Pan/zoom/pinch, fit/recenter controls, keyboard controls, desktop minimap, zoom-level detail, viewport culling, local viewport persistence, and an accessible searchable index.
- Piece detail panels with safe text, source/live links, images/videos, evidence, notes, explicit relationships, and allowlisted isolated opt-in previews.
- Reversible exploded views that preserve stable component identities and do not mutate published positions.
- Private owner/agent studio for creation/editing, profile/contact revisions, evidence/media metadata, connection selection, layout coordinates, history, and rollback preparation.
- Collision-aware canvas placement for new and revised pieces, with an open-position suggestion in the studio and server-side overlap validation.
- Strict REST/OpenAPI inputs, consistent errors/request IDs, metadata-only logs, CORS, security headers, rate limiting, separate agent/owner roles, and limited application DB permissions.
- Normalized relational state and immutable revisions. Draft → validate → private preview → exact owner approval → atomic publish. Stale approval and base conflicts are rejected.
- Cycle/duplicate/self/endpoint validation, stable connection IDs, shared components, and preservation of incoming relationships during updates.
- Provider-independent preparation boundary, deterministic fact-only proposal creation, preparation-only CLI, no paid AI key requirement.
- Additive English & Communication milestones: blueprint goals and realized accomplishments retain one stable identity, position, relationships, and revision history; targets/results and dates are optional; milestone evidence may be empty with explicit owner-attested wording.
- Goal/accomplishment studio entry, detail/index labels and filters, sketch-to-solid realization motion, agent draft examples, and workflow guidance for updating an existing goal.
- 45 automated tests; 6 discoverable Playwright cases; native PostgreSQL CI configuration; Docker/Caddy deployment files and operating instructions.
- Beginner README, comprehensive root AGENTS.md, architecture/design/content/agent/educational/security/operations manuals, status, decisions, changelog, and verification record.

## Verification status

Clean dependency installation, the full `npm run check` gate, `npm run format:check`, and all 45 unit/component/API tests passed for this feature. The previous production dependency audit reports zero known advisories. SQL and application-role provisioning ran on PGlite. Native PostgreSQL, Docker/Caddy, browser rendering/E2E, and hosted deployment remain unverified for this feature branch. See VERIFICATION.md for the explicit boundary and local commands.

## Intentional limitations

- No live AI provider, autonomous repository reader, or code runner. The default provider explicitly does not inspect repositories.
- Single-owner static bearer credentials; no account system, MFA, expiring tokens, or per-agent scopes.
- Media metadata/URLs only; no upload storage, transcoding, or arbitrary executable previews.
- No delete/unpublish UI or automatic backup scheduler. Rollback creates an approval-gated draft.
- Current studio lists the newest 100 revisions; the API supports paging to older ones.
- Fixed current graph fetch with a 1,000-identity installation cap; not benchmarked at that cap. Public node positions change through revisions rather than direct dragging.
- Rate limiting is per-process and does not trust forwarded IP headers; production proxy clients may share a tracked address until trusted-proxy handling is implemented.
- URL policy intentionally disallows query strings/fragments, so some third-party embed/share URLs need a stable alternative or external link.
- Secret-pattern screening is incomplete by nature; factual and privacy review remains an owner responsibility.
- No English goals or accomplishments have been entered; this feature supplies content structure and workflow only. It does not create an English & Communication container or invent portfolio content automatically.

## Next priorities

1. Complete native PostgreSQL, Docker/Caddy, desktop/mobile browser, keyboard/screen-reader, and staging backup/restore verification.
2. Add the owner's first genuine fragment with independent evidence and explicit publication approval.
3. Configure a private Git remote and production hosting only when authorized and credentials are available.
4. Add stronger owner authentication, a deliberate unpublishing workflow, and automated backups before wider operational use.
5. Extend AI/media/storage or graph scaling only when a concrete need justifies it; preserve current boundaries.

This file tracks platform development. Do not turn it into a public learning roadmap or achievement tracker.
