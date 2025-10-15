# Seeder Updates — Version 1.50 Update

## `20241010105500-domain-governance-reviews-seed.cjs`
- Inserts baseline governance reviews for the auth, marketplace, platform,
  finance, and analytics domains so staging/test environments surface meaningful
  remediation counts and trend data when the governance endpoints are queried.
- Populates scorecards with anonymised PII coverage metrics, last audit notes, and
  next-review cadences to match the design artefacts used by the admin and mobile
  dashboards.
- Safe to rerun; the seed uses `bulkInsert` with `ignoreDuplicates` semantics to
  avoid overwriting manual reviews in non-production environments.
