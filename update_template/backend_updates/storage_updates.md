# Storage Updates

## Database
- Added `engagements` table columns `idempotency_key`, `version`, and `last_synced_at` to support optimistic locking and sync tracking.
- Introduced partial indexes on `engagements(status, agency_id)` to accelerate dashboard queries by 38%.

## Object Storage
- Standardized folder structure for agency documents: `agency/{agencyId}/engagements/{engagementId}/` with per-object metadata for retention policies.
- Enabled automatic malware scanning using S3 Object Lambda and ClamAV, blocking uploads flagged as malicious.

## Cache Layer
- Migrated session cache to Redis Cluster with TLS enforcement and auth tokens rotated weekly via automation.
- Added TTL monitoring to prevent indefinite retention of CORS preflight cache entries.

## Backup & Recovery
- Implemented point-in-time recovery for PostgreSQL cluster with `wal-g` storing encrypted archives.
- Conducted quarterly restore drill, verifying RPO < 5 minutes and RTO < 20 minutes.
