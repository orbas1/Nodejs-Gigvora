# Migration Updates

## 20241120100000-database-governance-upgrade.cjs
- Wraps persona foreign-key updates inside a single transaction, deduplicating legacy rows before enforcing `ON UPDATE CASCADE` and `UNIQUE(userId)` across profile tables.
- Converts freelancer pricing to `DECIMAL(12,2)` for MySQL parity and prevents OTP reuse by replacing plaintext 2FA records with hashed, UUID-backed tokens and delivery method enums.
- Rebuilds two-factor indexes and backfills secure hashes for any legacy codes encountered during migration execution.
- Emits schema drift diagnostics by comparing `SequelizeMeta` with filesystem migrations and calculating SHA-256 checksums for audit events.

## Lifecycle Instrumentation
- Database lifecycle service now captures pool saturation, isolation level, replication role, and migration drift metrics, publishing them to health endpoints and audit logs.
- Shutdown flow marks the dependency as cleanly disconnected instead of degraded, eliminating false-positive alerts during graceful restarts.
