# Migrations Updates

## Migration Scripts Added
1. `20241015090000-add-engagement-idempotency.cjs`
   - Adds new columns and indexes to `engagements` table.
2. `20241015090500-create-webhook-delivery-logs.cjs`
   - Creates `webhook_delivery_logs` table with retention policy comment annotations.
3. `20241015091500-policy-diff-columns.cjs`
   - Adds JSONB diff columns to `system_audit_logs` and backfills existing records.

## Execution Order
- Staging and production environments must execute migrations sequentially as listed to avoid dependency conflicts.
- Migration pipeline enforces dry-run preview; DBAs must sign off before apply step.

## Rollback Plans
- Each migration includes `down` script removing columns/tables while preserving backup copy of data exported to S3 `db-backups/pre-rollback/`.

## Validation
- Schema snapshots generated before and after migrations using `npm run db:schema:diff` stored under `docs/db/snapshots/20241015`.
