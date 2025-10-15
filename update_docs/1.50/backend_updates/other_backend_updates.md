# Other Backend Updates — Version 1.50 Update

- Replaced ad-hoc `console` usage across server bootstrap, workers, and error handling with the shared Pino logger for consistent redaction and structured output.
- Added signal handling (`SIGTERM`, `SIGINT`) to guarantee graceful shutdown in containerised deployments, including worker teardown and readiness flag updates.
- Documented SQLite warning emitted during test syncs to maintain visibility while broader schema remediation remains in the backlog.
- Published schema artifacts under `shared-contracts/domain` by wiring `npm run schemas:sync` into the toolbelt so front-end and Flutter teams can consume canonical DTOs.
- Added `npm run schemas:clients` to compile TypeScript definitions for the shared contracts, enabling Node/React codebases to import strongly typed DTOs without manual duplication.
- Defaulted `SKIP_SEQUELIZE_BOOTSTRAP` to `true` inside `tests/setupTestEnv.js` so lightweight validation suites avoid expensive SQLite syncs while preserving an opt-out for full integration runs.
