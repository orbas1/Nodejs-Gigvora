# Database Change Log

## Schema Changes
1. **`engagements` Table**
   - Added `idempotency_key` (`varchar(64)`), `version` (`integer`, default `0`), and `last_synced_at` (`timestamp with time zone`).
   - Added partial index `idx_engagements_agency_status` on (`agency_id`, `status`) where `deleted_at` IS NULL.
2. **`system_audit_logs` Table**
   - New columns `change_before` and `change_after` (JSONB) capturing policy diffs.
3. **`webhook_delivery_logs` Table**
   - New table tracking webhook dispatch metadata with hashed payload digests.
4. **`policy_assignments` Table**
   - Added foreign key constraint to `roles` table with cascade update to maintain referential integrity.

## Data Migrations
- Backfilled `idempotency_key` for existing engagements using deterministic hash of (`agency_id`, `client_id`, `created_at`).
- Populated new policy capabilities for existing admins with targeted migration script `202410150915_add_policy_capabilities.cjs`.

## Performance & Maintenance
- Vacuum analyze schedule adjusted to run every 6 hours on `engagements` due to increased write volume.
- Added `pg_stat_statements` monitoring for slow queries on `disputes` view.

## Testing
- Executed migration suite locally and in staging using `npm run db:migrate:test`.
- Conducted rollback validation ensuring downgrade to previous schema completes without data loss.
