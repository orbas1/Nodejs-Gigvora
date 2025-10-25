# Operational readiness & release checklist

This runbook centralises the steps required to prepare a Gigvora release, verify
automation scripts, and capture restorable backups before deploying to staging or
production environments.

## 1. Pre-flight checklist

| Task | Command / Reference |
| --- | --- |
| Install dependencies | `npm ci` inside `gigvora-backend-nodejs` |
| Select Node.js version | Node 18 LTS (matching CI runners) |
| Provision database credentials | Populate `DB_URL` **or** `DB_HOST`, `DB_USER`, `DB_NAME`, and optional `DB_PASSWORD` in the environment |
| Provide runtime secrets | Copy `.env.example` to `.env` and fill JWT, SMTP, payments, storage, and analytics toggles |
| Confirm tooling binaries | Ensure `mysqldump` and `mysql` are available locally or set `MYSQLDUMP_PATH`/`MYSQL_PATH` |

## 2. Validate runtime configuration

Run the runtime configuration validator before touching infrastructure:

```bash
npm run config:validate
```

This command parses `.env.example` (or `.env` when supplied) and surfaces missing
values, invalid enums, and nested configuration issues so operations can remediate
problems before services start.

## 3. Synchronise schema artefacts

The same schema sources power backend validation, generated JSON Schemas, and
published TypeScript clients. Regenerate and verify that the repository stays clean:

```bash
npm run schemas:sync
npm run schemas:clients
```

Follow with a `git status` check. A clean tree confirms that the committed
contracts match the canonical Zod definitions consumed by the service and clients.

## 4. Exercise database backup automation

Always validate credentials and target directories **before** production cutovers
or schema migrations:

```bash
# Validate configuration without running mysqldump
node scripts/databaseBackup.js backup --dry-run --output ./backups/ci
```

The dry-run performs the same validation as a real backup while skipping the
`mysqldump` invocation, making it safe for CI pipelines and staging smoke tests.
Provide either a full `DB_URL` or the following environment variables:

- `DB_HOST`
- `DB_USER`
- `DB_NAME`
- `DB_PASSWORD` (optional when the server allows passwordless access)

Add `--encrypt-key <secret>` to confirm encrypted backups can be produced. The
script will still complete in dry-run mode and call out the simulated cipher.

## 5. Publish and monitor via CI

The `ops-tooling.yml` workflow runs on every pull request that touches backend,
contract, or documentation assets. It installs dependencies, re-generates schema
artefacts, performs the backup dry run, and fails the build if generated files drift
from source control. Use it as the source of truth for the automated guardrails
before merging to main.

## 6. Rollback preparation

1. Capture a real backup (without `--dry-run`) and copy both the `.sql.gz` file and
   `.meta.json` manifest to secure storage.
2. Archive the git commit hash and generated schema artefacts alongside the backup.
3. Document any manual configuration changes (feature flags, billing toggles, etc.)
   so they can be reversed alongside the code rollback.

## 7. Incident response linkage

During incidents, pair this runbook with the dedicated [runtime incident
playbook](./runtime-incident.md). Use the validated backup process before
applying hotfix migrations or destructive operations so the team retains a clean
restore point.
