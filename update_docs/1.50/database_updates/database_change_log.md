# Database Change Log — Version 1.50 Update

## 10 Apr 2024
- Created `runtime_announcements` table storing maintenance messaging with indexed `status`, `startsAt`, and `endsAt` columns so
  scheduled windows can be queried efficiently for public and admin endpoints.
- Persisted `audiences` and `channels` as JSON/JSONB arrays (dialect aware) plus `metadata` document for arbitrary key/value
  pairs, enabling downstream services to render targeted copy without schema churn.
- Added slug uniqueness constraint (`slug` unique index) to prevent duplicate announcements and keep cache keys deterministic.

## Historical Notes
- Earlier Version 1.50 entries covered lifecycle and domain registry changes; see prior weeks for detail.
