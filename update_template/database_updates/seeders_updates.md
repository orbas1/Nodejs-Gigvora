# Seeders Updates

## New Seed Data
- Added `20241015093000-engagement-lifecycle.js` seeder creating representative engagements across statuses for QA environments.
- Added `20241015093500-policy-capabilities.js` seeder establishing baseline RBAC capabilities for new tenants.

## Updates
- Updated admin user seeders to include MFA secret placeholders and `privacy:data-export` capability where appropriate.
- Seeded webhook subscriber examples for staging to validate new webhook delivery logging.

## Validation
- Seeder execution verified via `npm run db:seed:test` with idempotency checks ensuring reruns do not duplicate records.
- Added automated snapshot tests comparing seeded data against expected JSON fixtures.
