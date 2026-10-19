# Architectural decisions

## ADR 001 — npm workspaces and a modular monolith

Use npm workspaces for a compact React + NestJS monorepo. npm is supplied with Node, which simplifies the owner's setup. Module boundaries provide separation without the deployment and transaction costs of microservices. A later extraction requires a concrete operational need.

## ADR 002 — React Flow instead of a custom canvas engine

The requirement needs pan/zoom, touch interaction, keyboard support, nodes/edges, and viewport management. React Flow provides these as maintained primitives. A custom SVG canvas would duplicate gesture and accessibility work. WebGL/3D libraries were not justified. Nodes still use custom SVG/CSS, so the visual result does not use generic graph-editor chrome.

Official references reviewed: [viewport behavior](https://reactflow.dev/learn/concepts/the-viewport), [accessibility](https://reactflow.dev/learn/advanced-use/accessibility), and [component API including visible-element rendering](https://reactflow.dev/api-reference/react-flow).

## ADR 003 — Motion plus CSS/SVG

Motion handles the blueprint stroke/fill realization and reduced-motion preferences; CSS handles restrained surface, edge, and layout transitions. No separate animation engine or persistent idle loop is required.

## ADR 004 — Drizzle, normalized snapshots, and explicit SQL migrations

Drizzle supports typed PostgreSQL queries with the `pg` driver. SQL migrations are small, auditable, checksummed, and transactional. Live pieces, graph connections, and layout are normalized. Immutable revision bodies hold one entity's scalar/text content while evidence, media, outgoing links, and positions have separate snapshot tables.

Reviewed: [Drizzle PostgreSQL driver support](https://orm.drizzle.team/docs/get-started-postgresql) and [transactions](https://orm.drizzle.team/docs/transactions).

## ADR 005 — Shared Zod input contracts

Shared schemas provide runtime validation and inferred types. Strict schemas reject accidental unknown fields. Swagger schemas are generated through `zod-to-json-schema`. This avoids parallel DTO definitions drifting from frontend contracts. Validation never substitutes for independent evidence review.

## ADR 006 — Two roles, no automatic publication

For this single-owner foundation, separate random bearer tokens distinguish preparation from owner approval. Tokens are configured server-side and kept in browser memory only while the studio is open. Stronger authentication/MFA is a future enhancement. Agent credentials cannot approve, publish, or read the audit log.

Reviewed: [NestJS OpenAPI security](https://docs.nestjs.com/openapi/security) and [rate limiting](https://docs.nestjs.com/security/rate-limiting).

## ADR 007 — Immutable revisions plus exact approval digest

Every change creates a new revision. SHA-256 binds its hydrated content to the current workspace version. Publishing takes a database advisory transaction lock and rejects stale bases/digests. This deliberately requires re-review after an unrelated publication, trading convenience for clear approval scope. Rollback produces a new draft and never bypasses approval.

## ADR 008 — Structural DAG with explicit relationship meanings

Composition, reuse, dependency, and evolution share one acyclic graph; inspiration may be cyclic. Stable IDs enable multiple parents and independent inspection. Fragment containment is rejected. Deterministic connection IDs keep unchanged relationships stable across updates.

## ADR 009 — External coding agent first

No paid AI account is assumed. The default preparation provider only copies validated supplied facts and suggests a position. It explicitly does not inspect repositories. The CLI uses only the agent credential and omits publishing commands. A future provider implements the same interface and remains outside the approval authority.

## ADR 010 — Honest empty state and separate samples

The initial public collection is empty. Neutral examples are a separate client mode with a persistent label. Seed content creates private demonstration drafts only. This supports a polished first visit without fabricating the owner's achievements.

## ADR 011 — Strict opt-in iframe isolation

Preview origins are an exact server-configured allowlist. Visitors opt in. Iframes grant scripts but not same-origin, popups, top navigation, or device capabilities. Some demonstrations will need an external link; compatibility is not a reason to weaken isolation for untrusted code. The API never fetches supplied URLs.

## ADR 012 — Separate database roles

Migrations use administrator credentials. Runtime API connections use a limited role with only the necessary data/sequence permissions. Evidence snapshots are append-only for that role. Production containers do not give the API the migration secret. Role provisioning quotes SQL identifiers and literals using PostgreSQL functions and refuses to downgrade the current migration role accidentally.

## ADR 013 — Verification boundaries remain explicit

Automated tests use the PGlite PostgreSQL engine in WebAssembly. The native PostgreSQL branch is prepared for a disposable database in CI. Docker/native processes and the supported browser-control capability were unavailable in the build environment. Browser tests are included but not represented as passed. Initial release remains subject to native/staging/browser verification.

## ADR 014 — Security dependency constraint

The dependency review identified a Swagger transitive `js-yaml` advisory. The stack was aligned on NestJS 12 and Swagger 12.0.2 with patched js-yaml 5.4.2. The final production dependency audit reports zero known advisories. Keep the lockfile and rerun both audit and OpenAPI/regression tests before changing this resolution.
