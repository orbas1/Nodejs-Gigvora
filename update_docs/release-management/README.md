# Release Management State

- `active-release.json` tracks the live rollout record used by the backend metrics registry and CI tooling.
- `build-pipeline-report.json` is written by `scripts/full_stack_ci_report.mjs` after orchestrating lint, test, build, and contract steps.
