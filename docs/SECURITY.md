# Security model and review

## Implemented protections

- Server-side input validation through strict shared schemas, UUID validation, safe HTTPS URL rules, body-size limits, and consistent errors.
- Distinct agent/owner credentials with constant-time hash comparison. Approval/publication/audit are owner-only. Tokens are not in URLs, logs, localStorage, or the frontend build.
- Per-process request limiting and tighter token-check limits. Exact-origin CORS. Helmet and deployment security headers.
- Drafts stay private. Public projection removes private evidence and every review note. Public text is rendered as text rather than HTML.
- Immutable revision bodies, limited runtime DB permissions, foreign keys, structural graph validation, transaction locks, optimistic bases, and version-bound approval digests.
- Separate migration and application credentials in production. Parameterized queries and server-side quoting of role identifiers/literals.
- No repository execution or server URL fetch. No automatic publication or live AI dependency.
- Opt-in iframe previews with exact origin allowlisting, script-only sandbox, no same-origin, no device permissions, no-referrer, and external-link fallback.
- Common secret-pattern detection before draft persistence. This is supplementary to owner review and cannot detect all sensitive information.

## Threat boundaries

Visitors are untrusted. An agent can propose inaccurate content, so its credentials cannot approve. The owner must review evidence and sharing permissions independently. If an owner token is stolen, it grants owner authority; this foundation does not have MFA or an independent approval identity service.

Private evidence is visible to an authorized preparation agent because it needs context to edit content without losing it. Do not grant `AGENT_TOKEN` to an agent or tool that should not read that evidence. Tokens are global single-role secrets; per-user scopes and expiration are future work.

Public repository/live/media fields become visible after approval. Evidence privacy does not make a repository URL entered in the public repository field private. No automatic scanner verifies all claims or locates every secret. External media can be unavailable or change; the app does not host or audit its bytes.

## Dependency review

See VERIFICATION.md for the final audit result and exact execution limits. A transitive Swagger dependency advisory was found during development and addressed through dependency resolution. Keep the lockfile and repeat the audit before deployment. A clean advisory database result does not mean an application has no vulnerabilities.

## Remaining hardening

Before higher-risk use, add owner login/MFA, expiring scoped credentials, robust session/approval identity, shared rate limiting where scaled, tested trusted-proxy handling, backup/restore automation, and an emergency content-unpublish procedure. Add proper origin-specific CSP generation if preview policies become dynamic across deployments.

Native TLS, container behavior, production database role connectivity, browser security behavior, screen-reader behavior, and external preview compatibility were not verified here. They are explicit staging checks, not silently assumed protections.
