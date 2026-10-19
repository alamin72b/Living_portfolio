# Verification record

Initial implementation: 19 October 2026, Asia/Dhaka. This record separates executed checks from supplied configuration and unverified environments. No public deployment or remote Git push occurred.

## Executed checks

| Check                               | Result                                                                        |
| ----------------------------------- | ----------------------------------------------------------------------------- |
| Node/npm/Git environment inspection | Node 24.19.0, npm 11.9.0, Git 2.51.1 available                                |
| Shared contract compilation         | Passed                                                                        |
| Frontend TypeScript/build           | Passed                                                                        |
| Backend TypeScript/build            | Passed                                                                        |
| ESLint                              | Passed                                                                        |
| Vitest                              | 38 tests passed across 3 files                                                |
| SQL initial migration               | Executed against PGlite's PostgreSQL engine                                   |
| API workflow tests                  | Real Nest HTTP requests with persisted SQL state, no repository/API mocks     |
| Limited application role            | Table/schema permissions exercised under a restricted role in PGlite          |
| Playwright test discovery           | 6 browser cases discovered across desktop Chromium and mobile emulation       |
| Setup command                       | Generated unique configuration and preserved an existing file on a second run |
| Agent CLI help                      | Executed; preparation-only commands are present                               |
| Clean npm ci                        | Passed with the final lockfile                                                |
| Formatting check                    | All matched files passed Prettier                                             |
| Compiled API entry point            | HTTP 200 from liveness and OpenAPI, 18 documented paths                       |
| Deployment/example syntax           | Compose/CI YAML and example JSON parsed; containers not run                   |
| Production dependency audit         | Zero known production advisories after NestJS/Swagger alignment               |

Archive integrity and Git bundle restoration are checked during packaging. Source/configuration syntax checks do not replace real container or browser execution.

## What the 38 automated tests cover

- 10 shared-domain tests: valid content, independent IDs, descendants, graph integrity, cross-type cycles, inspiration cycles, duplicate/self/missing links, unsafe URLs, private-evidence removal, likely secrets, and position suggestions.
- 8 component/layout tests: honest empty index, search/filter, direct content access, neutral attribution, expansion action, reversible non-mutating layout, blueprint/working render states, and blocked preview origins.
- 20 API tests: empty initial state, readiness, authorization, CORS, OpenAPI bodies, invalid inputs, malformed/oversized JSON, secret rejection, private drafts, agent role denial, owner publication, evidence redaction, stale approvals, updates, rollback, relationship identity, graph cycles, stale bases, concurrent commits, profile workflow, honest preparation behavior, audit access, limited database permissions, and authentication rate limiting. Several related assertions share one test.

Tests use PGlite, a PostgreSQL engine compiled to WebAssembly. This executes SQL and constraints; it is not an in-memory JavaScript repository replacement. It does not prove behavior of a networked native PostgreSQL installation. The current PGlite suite executes the role-provisioning SQL, including CONNECT and table/schema grants, then exercises API operations under the limited role. Native network authentication remains a separate verification boundary.

## Not executed here

- Native PostgreSQL daemon integration: no native installation was available, and starting a temporary daemon under a non-root user was blocked by the environment's process restrictions.
- Docker image builds, Compose startup, Caddy configuration execution, HTTPS, DNS, and hosted deployment: Docker and hosting credentials were unavailable.
- Real-browser rendering, screenshots, touch gestures, screen-reader behavior, and Playwright E2E execution: the supported browser-control capability was unavailable. The tests are supplied and discovered, not reported as passed.
- GitHub Actions: configuration is included, but no remote repository/authentication was provided.
- Production-scale performance, load, backup/restore, and third-party iframe compatibility.

Do not label these gates as passed based on TypeScript compilation or component tests.

## Run checks locally

From the project root:

```bash
npm ci
npm run check
npm run format:check
npm audit --omit=dev
```

Native PostgreSQL integration requires an **empty disposable database**. The test creates its schema and leaves it behind. Never point this at an owner's content database or production. Set `TEST_DATABASE_URL` securely in your environment, then run:

```bash
npx vitest run apps/api
```

If your shell does not already have that variable, create a dedicated test environment in your CI or secret manager. Do not paste production credentials into command history. The supplied GitHub Actions service uses a disposable CI-only PostgreSQL database.

## Run browser workflows locally

Install the browser on your own computer:

```bash
npx playwright install chromium
```

Start the frontend/API against a disposable database, then in another terminal run:

```bash
npm run test:e2e
```

Default browser cases exercise sample exploration, search, expansion, stage demonstration, zoom/pan controls, keyboard navigation, and reduced motion. They do not publish real work. The owner publication case is skipped unless `E2E_OWNER_TOKEN` is supplied for that disposable test instance. To override the frontend address, set `E2E_BASE_URL`.

Manually verify: desktop/mobile sizing, non-overlapping controls, canvas touch behavior, readable text at appropriate zoom, focus visibility, dialog focus return/Escape, empty/offline states, actual profile contact links, and iframe sandbox behavior. Test the actual external media separately.

## Release decision

This is an implemented, locally tested foundation with deployment configuration. It is not a verified public deployment. Complete native PostgreSQL, Docker, real-browser, and backup checks in staging before a production launch.
