# Deploying and operating the complete application

## Verification boundary

These configuration files prepare a Docker deployment; they do not constitute a verified hosted service. Docker was unavailable in the build environment. Native PostgreSQL could not start under its process restrictions. No server credentials, domain, or paid service were supplied, and nothing was publicly deployed. Run the staging checks below before promoting the application.

## Intended production topology

- PostgreSQL 17 with a persistent named volume and no host-exposed database port.
- A one-shot migration job using database administrator credentials.
- NestJS API running as a non-root user with limited database credentials, a read-only filesystem, temporary `/tmp`, and an internal network port.
- Caddy serving built frontend files and forwarding `/api/*` to Nest. Ports 80/443 are public; Caddy manages HTTPS for a valid configured domain.

The same domain serves frontend and API, avoiding unnecessary cross-origin deployment complexity. Production Swagger is off. The frontend bundle has no tokens or database credentials.

## Prepare a server

Use a server where you can install Docker Engine and Compose, with enough memory for PostgreSQL and Node. Configure your domain's DNS to point at it. Permit public TCP 80/443 and UDP 443 if using HTTP/3; restrict administrative access. Keep the database port private.

Copy the source or clone your own Git remote. Do not copy a developer `.env`, database volume, or private preview directory into a public repository. Generate production credentials separately:

```bash
npm run setup
```

This script needs Node; alternatively generate equivalent random secrets using your deployment secret manager. An existing `.env` is preserved, so use a new deployment checkout or edit its configuration deliberately.

Set these values in the server's private `.env`:

| Variable                                  | Production value                                                             |
| ----------------------------------------- | ---------------------------------------------------------------------------- |
| SITE_ADDRESS                              | Your actual domain, e.g. `portfolio.example.com`, without a scheme           |
| CORS_ORIGINS                              | The exact public origin, e.g. `https://portfolio.example.com`                |
| POSTGRES_USER / POSTGRES_PASSWORD         | Database migration administrator and unique strong password                  |
| POSTGRES_DB                               | Dedicated database, usually `blueprint`                                      |
| APP_DATABASE_USER / APP_DATABASE_PASSWORD | Separate limited application role and unique password                        |
| OWNER_TOKEN                               | Unique random owner secret, at least 32 characters                           |
| AGENT_TOKEN                               | Different random preparation-only secret, at least 32 characters             |
| PREVIEW_ORIGINS                           | Optional comma-separated exact HTTPS origins; leave empty to disable iframes |

The setup script generates URL-safe hexadecimal passwords. If you choose other characters, percent-encode them in connection strings; do not assume a password containing `@`, `:`, or `/` can be inserted directly into a URL.

Production Compose assembles internal database URLs. The migration service gets the administrator connection and role-provisioning parameters. The API gets only the limited role's URL and does not receive the administrator password. Do not add `MIGRATION_DATABASE_URL` to the API service.

## Build and start

Run on the configured server:

```bash
docker compose -f compose.production.yml config --quiet
docker compose -f compose.production.yml up -d --build
docker compose -f compose.production.yml ps
docker compose -f compose.production.yml logs --tail=100 api migrate web
```

The quiet configuration command avoids printing resolved secrets. The migration service waits for PostgreSQL health. The API waits for successful migrations, and Caddy waits for API readiness. A failed migration must be investigated; do not bypass that dependency.

## Staging acceptance checks

1. Open your actual HTTPS domain and check certificate validity, desktop/mobile layout, pan/zoom/touch, keyboard navigation, and Index.
2. Check `/api/v1/health` and `/api/v1/health/ready` on that domain. The first is liveness; the second checks the database/schema.
3. Verify the public collection is empty before intentional publication and contains no neutral seed content.
4. Use a disposable staging creation to exercise draft, validate, preview, approve, publish, update, relationship preservation, and rollback.
5. Confirm the agent token cannot approve/publish or read `/admin/audit`.
6. Check unauthorized origins, private evidence redaction, blocked iframe origins, and reduced-motion settings.
7. Restart the API and verify the database-backed content persists. Test a database backup and restore into a separate disposable database.
8. Run browser E2E and native PostgreSQL tests as described in VERIFICATION.md. Do not run destructive test setup against production.

These steps are a release gate, not claims of completed verification in this delivery.

## Migrations and updates

Before a production schema change, make and verify a backup. Add a new SQL migration and keep Drizzle's schema aligned. Never edit an already-applied migration. The runner detects checksum mismatches and stops. It uses an advisory lock and one transaction per migration; role provisioning happens afterward and can be safely retried.

After deploying tested new source, rebuild and restart with the same Compose command. Preserve volumes. Update runtime secrets deliberately and restart the affected services. Changing a `POSTGRES_PASSWORD` environment value does not automatically change the password inside an already-initialized PostgreSQL volume.

The application database user has data permissions only. The migrator creates/alters that separate role and grants only the tables/operations needed by the service. A managed database that restricts role creation needs an administrator to apply equivalent grants. Never make the runtime user a superuser to work around a deployment error.

## Back up the database

The following command runs `pg_dump` inside the production database container and writes a backup on the host:

```bash
docker compose -f compose.production.yml exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > blueprint-backup.dump
```

The dump includes private evidence and history. Store it privately, encrypt it as appropriate, copy it off the host, and test restoration into a different database. Schedule backups through your infrastructure; no backup scheduler is included. Never restore over production without explicit owner authorization and a recovery plan. Back up Caddy data as appropriate to your operational needs.

## Stop safely

```bash
docker compose -f compose.production.yml stop
```

This preserves volumes. Do not use volume-deletion commands for ordinary restarts. The owner’s content lives in the database volume, not in the frontend source.

## Operational limitations

The current owner/agent authentication uses static bearer secrets, not account sessions/MFA. Rotate them when needed and keep remote access on HTTPS. Rate limiting is in memory and the API does not trust forwarded client-IP headers by default; behind Caddy, the limiter may aggregate clients at the proxy IP. For substantial public traffic, implement and test trusted-proxy handling and a suitable shared rate-limit store rather than simply raising limits.

There is no background worker, job queue, object-storage uploader, media transcoder, automatic repository scanner, or deletion/unpublishing UI. Media links point to separately hosted assets. The graph is bounded to 1,000 piece identities and has not been benchmarked at that limit. See PROJECT_STATUS.md for priorities.

## Alternative hosting

The frontend can be served by any static host and the API by a Node 24 host with PostgreSQL. Configure `VITE_API_BASE_URL` at frontend build time only if you intentionally use a separate API origin; it is public. Configure exact CORS and HTTPS on the backend and proxy correctly. Keep the same validation/approval/database invariants. This delivery does not configure a particular commercial provider or claim successful deployment to one.
