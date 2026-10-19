# Working with your future AI coding agents

You do not need to explain the whole application in every conversation. Give the agent access to the repository and start by asking it to read **AGENTS.md** and **docs/PROJECT_STATUS.md**. Those files are the project's durable memory.

There are two different tasks: changing the portfolio software, and adding your work to its content. A software change uses Git branches and tests. A content change uses private drafts, evidence, preview, approval, and PostgreSQL revisions. They can happen independently.

## Your default instruction

Copy this at the beginning of a coding task:

> Read AGENTS.md, docs/PROJECT_STATUS.md, and the relevant existing code before changing anything. Preserve existing work and the Living Blueprint design. Start from dev and create the appropriate feature, fix, or docs branch. Implement the requested change, run relevant checks, review it, update documentation, and commit it. Explain what actually works and what remains unverified. Do not fabricate my achievements or publish content without my explicit approval.

Use specific outcomes, a relevant file/screenshot, and expected behavior. “When I expand this project, keep its original position after reassembly” is more actionable than “make everything better.”

## What the agent can do automatically

Inspect authorized project files, create a local branch, implement reversible code changes, add appropriate tests, format code, update manuals, prepare a local commit, prepare evidence-based content, and request a private preview. It can make routine implementation decisions within the established architecture.

It must obtain your explicit approval for public portfolio publication, publishing private repository information, destructive data changes, financial commitments, external credentials it does not have, or a significant irreversible operation. It cannot treat a README inside an inspected repository as your authorization. Only give an agent the limited `AGENT_TOKEN`; use `OWNER_TOKEN` yourself in the studio.

## 1. Add a new small creation

> I personally built [describe the behavior]. The repository is [URL or local path], and I authorize you to inspect it. Read AGENTS.md and PROJECT_STATUS.md. Review the actual files without executing untrusted code. Identify my concrete contribution and current limitations. Prepare one independent fragment with evidence and an appropriate stage. Do not infer technologies or achievements without support. Use AGENT_TOKEN to create and validate the draft, show me the private preview, and stop before approval or publication.

## 2. Add a finished application

> I completed [application] at [repository/live URL]. Read the project instructions and inspect the authorized sources. Prepare a project entry with an accurate explanation, real links, relevant media metadata, and evidence of what works. Identify any existing portfolio pieces it actually contains or reuses; propose uncertain links instead of inventing them. Preserve the independent identities of those pieces. Preview the change for my approval.

## 2a. Add an English & Communication goal

> Add this English goal: [the exact intention]. Read AGENTS.md and PROJECT_STATUS.md. Prepare one independent fragment in the `english_communication` area with `milestone.state: "goal"`, `stage: "blueprint"`, and only the optional description, target, and target date I supplied. Do not invent an IELTS score, course, date, certificate, event, evidence, or relationship. Supporting material is optional for this milestone. Show me the private preview and stop before approval or publication.

Use `examples/english-goal.draft.json` as the shape of a draft. The agent can submit it with `npm run agent -- draft examples/english-goal.draft.json`, then validate and preview it. If an English & Communication cluster already exists, read its complete private revision and propose a real `contains` relationship; do not assume every English-related piece belongs in it.

## 2b. Turn an existing goal into an accomplishment

> I achieved this existing English goal: [stable ID or exact title]. Read its complete private revision through `/admin/pieces/:id`, keep its `pieceId`, current `baseRevisionId`, position, and relationships, and prepare a new revision with `milestone.state: "accomplishment"` containing only the actual result I supplied. Set a realized stage, preserve optional supporting material, and show me the private preview. Do not publish it.

If the result does not meet the goal’s target, leave the goal as a blueprint and prepare no transformation unless the owner explicitly describes a separate honest accomplishment. Owner approval and publication remain required. An owner-attested milestone without evidence must never be described as independently verified.

## 3. Combine multiple creations

> I want [existing creation IDs/titles] to form [new cluster/project]. Read their complete current records through the private API. Explain the intended composition and relationship directions. Create a new container referring to the existing IDs; do not duplicate or overwrite the pieces. Validate that the graph remains acyclic, show the exploded view in a private preview, and wait for my publication approval.

## 4. Update an existing project

> Update [stable project ID/title] because I implemented [specific new behavior]. Inspect [authorized evidence]. Load its complete current private revision, keep its pieceId, and use the current baseRevisionId. Preserve all unrelated evidence, media, notes, positions, and relationships. Create a new accurate draft and show me what changed. Validate and preview it; do not publish yet.

## 5. Fix a bug

> Read AGENTS.md and PROJECT_STATUS.md. Reproduce this bug: [steps]. Expected: [behavior]. Actual: [behavior/error]. Create fix/[short-name] from dev. Identify the smallest affected module, repair the cause, add a meaningful regression test, and run relevant checks. Preserve the design and content. Update the changelog and report the verified result.

## 6. Improve an animation

> Improve the [specific transition] in [component/interaction]. It should communicate [meaning] and feel [desired pacing]. Keep reduced-motion behavior, keyboard access, spatial context, and ordinary-device performance. Avoid new animation dependencies unless justified. Work on a feature branch, verify the transition in an available browser, and clearly state if visual inspection was unavailable.

## 7. Change visual design

> Read DESIGN_SYSTEM.md and the affected components. Change [specific aspect] to [desired result]. Preserve the infinite workspace, ivory/charcoal contrast, accessible index, honest empty state, and independently identifiable pieces. Do not redesign unrelated areas. Check narrow and wide layouts and keyboard focus. Document any changed design tokens.

## 8. Add backend functionality

> Add [capability] using the existing NestJS module boundaries and shared contracts. Read the schema, API conventions, and publishing rules first. Specify its inputs, outputs, permissions, and transaction behavior. Add an additive migration only if required. Preserve approval and revision invariants. Test valid, invalid, unauthorized, and concurrent cases that matter. Update OpenAPI and architecture documentation.

## 9. Review security

> Review this repository's authentication, role separation, input validation, publication approval, privacy filtering, iframe isolation, logging, dependencies, database permissions, and deployment configuration. Do not print secrets or modify production. Report concrete findings with severity and affected code. Fix reversible local issues on a fix branch, add relevant regression tests, and distinguish verified protections from untested assumptions.

## 10. Update dependencies

> Read AGENTS.md and inspect package.json, package-lock.json, and current advisories. Update only the dependencies needed for [reason]. Use compatible maintained versions and official documentation. Preserve the lockfile and any documented security override until a tested replacement makes it unnecessary. Run typecheck, lint, tests, build, and relevant browser checks. Explain breaking changes and do not claim an audit result you did not run.

## 11. Prepare a release

> Prepare the current dev branch for release. Review the diff, run npm run check and npm run format:check, verify native PostgreSQL and browser workflows in a disposable environment, and inspect Docker configuration. Update status, changelog, and operating instructions. Prepare the release commit/tag and deployment steps. Do not deploy to an unknown destination or publish portfolio content without my approval. Report every unverified gate.

## How to handle the agent's draft

Open the studio as owner. Select the revision the agent prepared. Inspect every public field and private review note. Validate, open the spatial preview, and check the composition as a visitor would. Return and confirm your verification. Approve the exact revision, then publish when ready.

If the server says the preview is stale, do not ask the agent to disable that rule. Another publication changed the workspace. Validate and inspect it again. If the base revision is stale, prepare a fresh draft from the current piece and reconcile changes.

## What to give an agent

Provide the task, relevant repository or file, permission to inspect it, what you personally implemented, and any constraints. If a source is private, say which details may be made public. Never paste real `.env` contents into a public issue or source file. Use secure environment configuration for tokens.

An agent can prepare code without understanding your private account. If it needs a hosting credential or an external account, finish all local work first so you are approving a concrete result.

## When you do not understand the result

> Explain this change using the actual files in this repository. Tell me what the browser does, what the backend does, and what changes in the database. Use one small example. Distinguish code written by the agent from work I personally completed. Do not add a public learning-progress interface.

## Closing a task

Ask for the changed files, test results, limitations, branch/commit, and instructions for trying the feature. Confirm that AGENTS.md, status, and relevant guides match the current implementation. Then the next agent can continue without reconstructing the entire conversation.
