# The Living Blueprint — An Infinite Workspace

**Nothing here appeared fully formed. Everything grew from something smaller.**

A personal portfolio for MD Al Amin Bhuiyan. The main experience is a warm ivory and charcoal spatial workspace. Visitors pan, zoom, inspect creations, follow meaningful connections, and unfold larger creations into their parts. An accessible index provides the same content without needing to navigate a canvas.

The portfolio platform was implemented with AI. It must never imply that its owner personally wrote this infrastructure. The actual portfolio begins with no published achievements. Only work the owner genuinely completes should be added. A separate **Sample workspace** demonstrates the interface using neutral, clearly labeled examples.

## What is included

- React + TypeScript + Vite frontend with React Flow, Motion, SVG, responsive CSS, and locally bundled fonts.
- NestJS REST API, OpenAPI/Swagger, shared Zod validation, structured logs, authorization, and rate limiting.
- PostgreSQL schema and SQL migrations, Drizzle ORM, relational media/evidence/relationships/layouts, immutable content revisions, and audit events.
- Private studio for fragments, clusters, projects, profile edits, evidence, media, positions, and relationships.
- Draft → validate → private preview → owner approval → publish workflow, with stale-approval rejection and approval-gated rollback.
- An external-agent CLI and optional provider interface. **No AI API key is required.** No repository is automatically downloaded, inspected, or executed.
- Automated unit, component, and API integration tests; browser E2E test definitions; Docker/Caddy deployment files; GitHub CI configuration.

Read [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md) for limits and [docs/VERIFICATION.md](docs/VERIFICATION.md) for what was actually executed.

## The parts in simple English

| Part                  | Its job                                                                                |
| --------------------- | -------------------------------------------------------------------------------------- |
| Browser / React       | Draw the workspace, respond to clicks, show forms and private previews.                |
| API / NestJS          | Receive requests, check permission and data, enforce approval rules.                   |
| Database / PostgreSQL | Keep the real content, relationships, positions, and revision history after a restart. |
| Drizzle               | Help TypeScript code read and write the database using structured queries.             |
| Shared package        | Give the frontend and backend the same content definitions and validation rules.       |

The browser requests published content from the API. The API reads the database and sends JSON, which is a structured text format. The browser uses that JSON to draw the workspace. The studio sends private drafts to the API; only an owner-approved revision becomes visible publicly.

## Install the prerequisites

Install **Node.js 24 LTS** from [nodejs.org](https://nodejs.org/en/download). Node runs the JavaScript tooling; npm is included. The project requires Node 22.12 or later; Node 24 was used for verification.

Install **Git** from [git-scm.com](https://git-scm.com/downloads). Git records changes and branches. On Ubuntu, Git is also available through the operating system’s package manager.

For the easiest local database setup, install **Docker with Docker Compose** using the [official Docker instructions](https://docs.docker.com/get-started/get-docker/). Docker runs PostgreSQL in an isolated container. An existing PostgreSQL 17 database can be used instead.

Open a terminal. A terminal is the application where you type commands. Check the prerequisites:

```bash
node --version
npm --version
git --version
docker --version
docker compose version
```

The first three were available in the build environment. Docker was not; the Docker instructions below are provided for your machine and have not been executed here.

## Open the project folder

Extract the ZIP. Open the extracted `living-blueprint` folder in VS Code. Choose **Terminal → New Terminal**. The terminal should be inside the folder containing `package.json`.

If your terminal is already in the folder that contains `living-blueprint`, enter:

```bash
cd living-blueprint
```

`cd` means “change directory.” Do not type this again if you are already inside the project.

## Install and start the complete application

Run one command at a time:

```bash
npm ci
npm run setup
docker compose up -d db
npm run db:migrate
npm run dev
```

What these do:

1. `npm ci` installs the exact versions recorded in `package-lock.json`.
2. `npm run setup` creates a private `.env` file with unique random credentials. It never overwrites an existing `.env`.
3. `docker compose up -d db` starts the local PostgreSQL container. Its port is exposed only to your own computer.
4. `npm run db:migrate` creates the database tables and a limited application database role. It uses the separate migration connection. Run it after the database is healthy; rerunning it checks migration checksums and skips applied migrations.
5. `npm run dev` starts the shared-contract watcher, the backend, and the frontend. Leave this terminal open.

The default setup uses one database administrator connection for migrations and a separate `blueprint_app` connection for the application. The normal API connection cannot create tables or rewrite historical evidence. PostgreSQL data is stored in a Docker volume, not in the source files.

### Where to open things

| What                     | Address                                   |
| ------------------------ | ----------------------------------------- |
| Portfolio frontend       | http://localhost:5173                     |
| Private studio           | http://localhost:5173/#manage             |
| API liveness             | http://localhost:3001/api/v1/health       |
| API database readiness   | http://localhost:3001/api/v1/health/ready |
| Published workspace JSON | http://localhost:3001/api/v1/workspace    |
| API documentation        | http://localhost:3001/api/docs            |
| OpenAPI JSON             | http://localhost:3001/api/docs-json       |

These are local addresses, not a public deployment. In production, Caddy serves the frontend and forwards `/api/*` to NestJS on the same domain.

### Start the parts separately

In one terminal:

```bash
npm run dev:api
```

In a second terminal, inside the same project folder:

```bash
npm run dev:web
```

These commands build the shared contracts first. Database setup and migrations must already be complete for content operations.

### Explore without PostgreSQL

```bash
npm ci
npm run dev:web
```

Choose **Explore an example** in the frontend. The interface works with the bundled neutral example. The offline notice is intentional; no data can be saved in this mode. It does not silently replace a broken backend with invented published work.

### Use an existing PostgreSQL database

Run `npm run setup`, then edit `.env` locally:

- `DATABASE_URL`: the limited application connection.
- `MIGRATION_DATABASE_URL`: a connection allowed to create tables and the application role.
- `APP_DATABASE_USER` and `APP_DATABASE_PASSWORD`: the separate application role to provision.

Use a dedicated database for this project. If your managed database does not allow creating roles, have its administrator create and grant the application role using the permissions in `apps/api/src/db/provision.ts`, then remove both `APP_DATABASE_*` settings before running migrations. Keep `DATABASE_URL` pointed at the limited role. Follow your database provider’s TLS connection instructions; do not turn off certificate checks.

## Add your first genuine creation

1. Open `.env` in your editor and copy the value after `OWNER_TOKEN=`. Do not include the name or equals sign. Keep it private.
2. Open http://localhost:5173/#manage and paste it into the access-token field.
3. Select **New creation**. A small calculator or one independent behavior is usually a **fragment**.
4. Enter what you actually implemented. Include your repository or a demonstration if you have one. Provide at least one evidence claim and a link or review note.
5. Choose the honest current stage. Stages are descriptive, not a mandatory sequence.
6. Save the private draft. Select **Validate & prepare preview**, then **Open spatial preview**.
7. Return to review. Check the claims, evidence, attribution, links, and permissions. Tick the verification box and approve that exact revision.
8. Select **Publish approved revision**. It now appears in the public workspace.

Private evidence stays in the studio. Evidence notes are always private. Public description, repository URL, public notes, media URLs, and relationships are public after approval. Do not put private repository URLs into public link fields.

You can edit your name, introduction, and contact details using **Edit introduction**. Those changes follow the same approval workflow. No email address or GitHub link was invented for you.

## Use AI safely

Give your external coding agent **AGENTS.md** and **docs/AGENT_WORKFLOW.md**. The agent should use `AGENT_TOKEN`, which cannot approve or publish. Owner approval remains your responsibility.

Example prompt:

> Read AGENTS.md and docs/PROJECT_STATUS.md. I personally built [creation]. With my authorization, inspect [repository] without executing untrusted code. Prepare an evidence-based fragment draft using the existing API and AGENT_TOKEN. Keep private information private, propose relationships only when justified, and show me the private preview. Stop before approval and publishing.

The CLI accepts JSON files and revision IDs. It has no approve or publish command:

```bash
npm run agent -- help
npm run agent -- list
```

Copy and edit `examples/first-creation.draft.json`, then submit the edited file:

```bash
npm run agent -- draft examples/first-creation.draft.json
```

Replace the example text with real information first. The response gives a revision ID. Use that actual ID in place of `REVISION_ID`:

```bash
npm run agent -- validate REVISION_ID
npm run agent -- preview REVISION_ID
```

Preview files are private and saved in ignored `.local/`. Use the studio to inspect and approve. A future live AI provider can implement `ContentPreparationProvider`; the current deterministic provider explicitly says it has not inspected the repository.

## Stop the application

Press **Ctrl+C** in the terminal running `npm run dev`. If you started two terminals, press Ctrl+C in both.

To stop PostgreSQL while keeping its data:

```bash
docker compose stop db
```

To start it again:

```bash
docker compose start db
```

Do not delete the database volume unless you intentionally want to erase your portfolio data.

## Tests, formatting, and production builds

```bash
npm test
npm run typecheck
npm run lint
npm run format:check
npm run build
```

Or run the combined gate:

```bash
npm run check
```

`npm test` runs isolated tests using PGlite. PGlite runs a PostgreSQL engine in WebAssembly, so these tests do not require Docker or your real database. Tests never publish into your local portfolio database.

Browser tests require a locally installed Playwright Chromium browser and running test instances. Read `docs/VERIFICATION.md` before running them. The owner workflow browser test is opt-in because it creates and publishes clearly labeled test content.

Build output appears in `apps/web/dist`, `apps/api/dist`, and `packages/shared/dist`. Build success means the code compiled and bundled; it does not mean you have deployed it.

Start the compiled API after building:

```bash
npm run start -w @blueprint/api
```

Run the frontend’s production-build preview locally:

```bash
npm run preview -w @blueprint/web
```

The preview server uses port 4173. Its API proxy targets port 3001. Add `http://localhost:4173` to `CORS_ORIGINS` only if you change to a cross-origin API arrangement; the default same-origin proxy does not require it.

## Git branches and the supplied history

The archive includes `git-history.bundle`. Restore its branches without replacing working files:

```bash
npm run restore:git
git branch
git status
```

`main` is the local release baseline, `dev` is the integration branch, and completed work is recorded on descriptive feature branches. The restore command opens `dev`. No remote repository was configured, pushed, or overwritten.

For a new task:

```bash
git switch dev
git switch -c feature/my-change
```

After tests pass and changes are reviewed, commit on the feature branch and merge into `dev`. Promote reviewed releases into `main`. Read `AGENTS.md` for the full workflow. Set your own Git name/email before making new commits.

## Deploy

Deployment requires a server, domain/DNS, production credentials, and backups. These were not supplied, so no public deployment was made. `compose.production.yml`, two Dockerfiles, and `deploy/Caddyfile` prepare the full stack for a Docker host. Caddy serves the frontend and can manage HTTPS for your domain.

Read **docs/operations/DEPLOYMENT.md** before running:

```bash
docker compose -f compose.production.yml up -d --build
```

The production environment must have real secrets, a public HTTPS origin in `CORS_ORIGINS`, and your domain in `SITE_ADDRESS`. Production Swagger is disabled. Deployment containers were not executable in the build environment; complete the documented staging checks before treating this as a production release.

## Common problems

| Problem                                   | What to do                                                                                                                                                                             |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm` not found                           | Install Node.js, then reopen your terminal.                                                                                                                                            |
| Engine/version error                      | Use Node 24 LTS or at least 22.12.                                                                                                                                                     |
| `package.json` not found                  | Open the terminal in the extracted `living-blueprint` folder.                                                                                                                          |
| API says configuration is invalid         | Run `npm run setup`; inspect `.env` locally for unresolved placeholders. Do not paste secrets into a chat.                                                                             |
| Database connection refused               | Start PostgreSQL and check its health. Ensure port 5432 is free.                                                                                                                       |
| Permission denied for a table             | Run migrations using the migration connection to provision the limited application role.                                                                                               |
| Database password changed but login fails | A Docker database volume keeps its old password. Update the role deliberately; do not erase the volume to troubleshoot valuable data.                                                  |
| Content service unavailable               | Check the backend terminal and `/api/v1/health/ready`. Example mode does not save data.                                                                                                |
| Port 5173 or 3001 is occupied             | Stop the other process. If changing the API port, update the Vite proxy and CORS configuration consistently.                                                                           |
| Invalid token                             | Copy the correct token from `.env`; agent and owner tokens differ. Refreshing closes the studio session.                                                                               |
| Stale preview / workspace changed         | Validate, preview, and approve again. The server protects against publishing an outdated approval.                                                                                     |
| Old base revision                         | Open the current published piece and create a new draft from it.                                                                                                                       |
| Relationship cycle                        | Remove the circular structural relationship. Inspiration may be cyclic; composition and dependency may not.                                                                            |
| Preview refuses to load                   | Check the exact allowed origin and whether the external site permits framing. Some sites require capabilities this strict sandbox intentionally does not grant. Use its external link. |
| Mobile canvas feels too small             | Open Index. Use the direct content list or pinch to zoom.                                                                                                                              |
| Empty portfolio                           | Expected until you approve your first genuine creation.                                                                                                                                |

## Read next

- [docs/LEARNING_GUIDE.md](docs/LEARNING_GUIDE.md): how the system works in plain English.
- [docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md): fragments, relationships, privacy, and publication.
- [docs/AGENT_WORKFLOW.md](docs/AGENT_WORKFLOW.md): copyable prompts for future agents.
- [AGENTS.md](AGENTS.md): durable engineering instructions.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): modules, database, data flow.
- [docs/VERIFICATION.md](docs/VERIFICATION.md): test evidence and unverified environments.

# Living_portfolio
