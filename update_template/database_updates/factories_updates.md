# Factories Updates

## New Factories
- `engagementFactory` now supports statuses `draft`, `proposed`, `confirmed`, and injects default milestones for testing workflows.
- Added `policySnapshotFactory` generating realistic policy diffs for auditing scenarios.

## Enhancements
- Updated `userFactory` to optionally generate MFA-enrolled users with backup codes for security testing.
- Extended `paymentDisputeFactory` with `evidence` attachments referencing fixture documents stored under `tests/fixtures/documents`.

## Usage Guidance
- Documented new helper traits in `tests/factories/README.md` with example usage for E2E tests.
- Provided deterministic seeding options to ensure consistent snapshots across CI runs.
