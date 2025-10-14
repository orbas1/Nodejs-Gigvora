# Other Backend Updates — Version 1.50 Update

- Replaced ad-hoc `console` usage across server bootstrap, workers, and error handling with the shared Pino logger for consistent redaction and structured output.
- Added signal handling (`SIGTERM`, `SIGINT`) to guarantee graceful shutdown in containerised deployments, including worker teardown and readiness flag updates.
- Documented SQLite warning emitted during test syncs to maintain visibility while broader schema remediation remains in the backlog.
