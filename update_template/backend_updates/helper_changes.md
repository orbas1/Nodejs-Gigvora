# Helper & Utility Changes

## New Utilities
- Added `sanitizeInput` helper in `src/utils/security.js` performing schema-aware sanitization before persistence, with context-sensitive rules for HTML fields versus markdown content.
- Introduced `timebox` promise helper to standardize timeout handling across third-party integrations; defaults to 8 seconds and emits metrics through `observability/metricsRegistry`.
- Created `currencyFormatter.toMinorUnits` to normalize provider payouts by currency, ensuring consistent rounding when generating wallet ledger entries.

## Updated Utilities
- Enhanced `asyncWrapper` to propagate `correlationId` metadata into the request context, enabling end-to-end tracing through handlers and message queues.
- Expanded `validationSchemas` to cover agency onboarding, referencing `shared-contracts/agency.ts` for canonical definitions.
- Hardened `passwordPolicy` helper by adding entropy scoring and preventing breached password reuse via `haveibeenpwned` offline dataset refreshed nightly.

## Deprecations
- Deprecated `legacySanitize` with console warnings and feature flag `enableLegacySanitize` defaulting to `false`; migration guide shared with partner teams.

## Testing
- Added dedicated unit coverage in `tests/utils/security.spec.js` (36 new cases) verifying sanitization branches.
- Benchmarked helper performance under load using `npm run bench:utils`, staying within ±3% of prior throughput despite additional checks.
