# Operational Tooling Checklist

This runbook is the canonical checklist for running Gigvora's automation scripts and validating artefacts before a release. It replaces the duplicate instructions that previously lived in the repository README and `Gigvora_Guide.md` so operators can follow a single source of truth.

## 1. Preflight

1. Ensure Node.js 18+, npm 9+, and MySQL 8.0+ are installed on the machine executing the scripts.
2. Copy `gigvora-backend-nodejs/.env.example` to `.env` (or point the tooling to an overrides file) and fill in the database, SMTP, monetisation, payments, storage, and realtime credentials.
3. Export the following environment variables if the defaults do not match your host:
   - `MYSQLDUMP_PATH` – override the `mysqldump` binary location when it is not on the `PATH`.
   - `MYSQL_PATH` – override the `mysql` client path used during restores.
   - `GIGVORA_BACKUP_ENCRYPTION_KEY` – optional encryption key used for backups (passed through `--encrypt-key`).

## 2. Required configuration for tooling scripts

| Script | Mandatory configuration | Optional configuration |
| --- | --- | --- |
| `validateRuntimeConfig.js` | A readable runtime configuration file path (defaults to `.env.example`). | None. |
| `syncDomainSchemas.js` | Zod domain schemas under `src/domains/schemas` accessible with read permissions. | None. |
| `generateDomainClients.js` | JSON schema outputs from `syncDomainSchemas.js`. | None. |
| `databaseBackup.js` | MySQL connection credentials via `DB_URL` or `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`; `mysqldump` on the `PATH`. | `MYSQLDUMP_PATH`, `MYSQL_PATH`, `--encrypt-key`, `--dry-run`, output directory overrides. |

If `DB_URL` is not provided the scripts expect `DB_HOST`, `DB_USER`, and `DB_NAME` to be present; missing values will now raise descriptive errors before the tooling starts.

## 3. Running the CI automation locally

1. From `gigvora-backend-nodejs/`, install dependencies with `npm install`.
2. Execute the consolidated tooling command:
   ```bash
   npm run ci:tooling
   ```
   - Validates `.env.example` using `validateRuntimeConfig.js`.
   - Regenerates shared JSON schemas (the CI run uses `--skip-registry` to avoid loading the full domain registry while local runs without the flag refresh `registry-snapshot.json`) and TypeScript clients.
   - Performs a `databaseBackup.js backup --dry-run` check to confirm credentials and binaries resolve without creating a dump file.
   - Fails if running the scripts introduces uncommitted changes under `shared-contracts/`.
3. (Optional) Supply CLI flags when calling `node scripts/operationalToolingCheck.js` directly:
   - `--skip-backup` skips the dry-run backup regardless of environment variables, useful when running against offline laptops.
   - `--force-backup` runs the dry-run even if `CI_SKIP_TOOLING_BACKUP=1` is set.
   - `--backup-output <dir>` stores the dry-run artefacts in a directory you control (temporary directories are created and cleaned up automatically otherwise).
4. Enable a real backup attempt by exporting `CI_SKIP_TOOLING_BACKUP=0` (or passing `--force-backup`) and providing reachable database credentials. The script writes the dump into a timestamped file beneath the supplied or temporary output directory.

## 4. Release-day workflow

1. Run `npm test` and `npm run lint` across the backend.
2. Run `npm run ci:tooling` to verify configuration, schemas, and backup readiness.
3. If promoting to production, invoke `node scripts/databaseBackup.js backup --encrypt-key <key>` to create an encrypted dump and store the `.sql.gz.enc` artefact plus the generated `.meta.json` file in secure object storage.
4. Archive the command output together with the CI run URLs for audit trails.

## 5. Incident response notes

- Use `node scripts/databaseBackup.js restore --file <path> --encrypt-key <key>` to restore an encrypted snapshot in staging before attempting a production rollback.
- Use `node scripts/databaseBackup.js verify --file <path>` on existing dumps to confirm integrity (checksum + metadata) without touching the database.

## 6. Updating documentation

When improving or extending the automation suite, update this file instead of scattering instructions across the README or other guides. Reference this runbook from onboarding materials so engineers reach the current process quickly.
