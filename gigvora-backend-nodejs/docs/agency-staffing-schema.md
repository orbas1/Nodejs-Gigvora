# Agency Staffing Portfolio Schema

This document captures the production schema that powers agency project management, portfolio insights, and auto-match delivery. It reflects the columns provisioned by the `20241226103000-agency-staffing-portfolio.cjs` migration together with the curated demo records seeded by `20241226104000-agency-staffing-demo.cjs`.

## `pgm_projects`

The agency project table now stores the fields required for portfolio analytics, lifecycle tracking, and auto-match orchestration:

- **Lifecycle** – `category`, `skills` (JSON array), `duration_weeks`, and `lifecycle_state` allow the service to segment open vs closed work and normalise skill taxonomies.
- **Budget** – `budget_currency`, `budget_allocated`, and `budget_spent` keep the portfolio health metrics consistent with the API response.
- **Auto-match configuration** – Flags (`auto_match_enabled`, `auto_match_accept_enabled`, `auto_match_reject_enabled`) and thresholds (`auto_match_budget_min/max`, `auto_match_weekly_hours_min/max`, `auto_match_duration_weeks_min/max`, `auto_match_skills`) map one-to-one with the payload used by `updateProjectAutoMatchSettings`.
- **Operational metadata** – `auto_match_notes` captures operator rationale, while `auto_match_updated_by` records the actor responsible for the most recent tuning. Audit trails are persisted inside the JSON `metadata` column under the `staffingAudit` key.

Two supporting indexes (`pgm_projects_owner_lifecycle_idx` and `pgm_projects_auto_match_enabled_idx`) optimise portfolio and filter lookups.【F:gigvora-backend-nodejs/database/migrations/20241226103000-agency-staffing-portfolio.cjs†L86-L141】【F:gigvora-backend-nodejs/database/migrations/20241226103000-agency-staffing-portfolio.cjs†L151-L166】

## `pgm_project_automatch_freelancers`

The dedicated auto-match freelancer table stores scoring decisions and status transitions tied to each project:

- Core attributes (`freelancer_id`, `freelancer_name`, `freelancer_role`) plus optional `score` support ranked queue rendering.
- Boolean `auto_match_enabled` mirrors per-candidate opt-out behaviour, while the `status` enum (`pending`, `accepted`, `rejected`) powers queue analytics.
- `notes` and JSON `metadata` allow agency operators to retain context on outreach, sourcing channels, or QA checkpoints.

A unique constraint on `(project_id, freelancer_id)` prevents duplicate queue entries, and secondary indexes on `status` and `auto_match_enabled` accelerate dashboard filters.【F:gigvora-backend-nodejs/database/migrations/20241226103000-agency-staffing-portfolio.cjs†L168-L217】

## Seeded Demo Data

Seeder `20241226104000-agency-staffing-demo.cjs` provisions two portfolio projects:

1. **Global Creative Retainer** – An active engagement with auto-match enabled, populated with skill-based thresholds and two freelancers covering accepted and pending queue states.
2. **Design System Upgrade** – A recently completed project illustrating closed lifecycle handling and historical staffing audit entries.

Each project includes realistic `staffingAudit` events (creation, configuration changes, completions) and financially accurate allocations, while associated auto-match entries capture score distributions, notes, and metadata for analytics dashboards.【F:gigvora-backend-nodejs/database/seeders/20241226104000-agency-staffing-demo.cjs†L28-L165】

These records provide production-grade fixtures for manual verification and automated tests that assert the new service behaviours in `agencyProjectManagementService`.
