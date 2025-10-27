# Release Management State

The release management service now persists rollout data in the relational store so tooling, analytics, and observability all reference the same source of truth.

- `release_pipelines`, `release_phases`, `release_segments`, `release_checklist_items`, `release_monitors`, `release_events`, and `release_pipeline_runs` are created by the migration `20250510100000-release-management.cjs` and seeded with a live upgrade in `20250510101500-release-management-bootstrap.cjs`.
- `scripts/full_stack_ci_report.mjs` writes a structured run summary, synchronises monitors, checklist gates, and records a `release_pipeline_runs` entry for the orchestrated CI pipeline.
- `scripts/release/generate_release_notes.mjs` reads from the service APIs (`getReleaseRolloutSnapshot`, `getPipelineRunHistory`) to build markdown release notes backed by the database instead of static JSON snapshots.
- `active-release.json` captures an exported snapshot of the seeded rollout for documentation and onboarding purposes, while live automation always queries the service.
