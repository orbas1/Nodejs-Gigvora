# Migrations Updates — Version 1.50 Update

## `20241015121500-runtime-maintenance-announcements.cjs`
- Creates `runtime_announcements` table with auto-incrementing primary key, unique `slug`, required `title`/`message`, enum-like
  `severity`/`status`, JSON(B) `audiences` and `channels`, optional `startsAt`/`endsAt`, boolean `dismissible`, audit fields
  (`createdBy`, `updatedBy`), and JSON(B) `metadata` for downstream rendering.
- Adds indexes on `status`, `startsAt`, `endsAt`, and `slug` to support admin filtering, upcoming window lookups, and uniqueness
  enforcement.
- Migration is idempotent and compatible with PostgreSQL and SQLite (falls back to JSON when JSONB unavailable); down migration
  drops the table and associated indexes.

## Operational Guidance
- Run `npx sequelize-cli db:migrate` after pulling the update. Admin dashboards and mobile clients rely on the table to return
  maintenance banners; absence will surface 500 responses on the new endpoints.
- Ensure migration runs before toggling maintenance features in production to avoid partially wired UI surfaces referencing empty
  datasets.
