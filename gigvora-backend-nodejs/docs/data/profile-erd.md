# Profile Data Relationships

The profile data layer combines base member profiles with specialised company, agency, and freelancer extensions. The `profile_directory` view introduced in migration `20240601030000-add-profile-directory-view.cjs` unifies these tables for analytics and operational reporting.

```
users (1) ──┬─> profiles (1)
            ├─> company_profiles (0..1)
            ├─> agency_profiles (0..1)
            └─> freelancer_profiles (0..1)
```

Key characteristics:

- **profiles** – Stores core member story (headline, bio, skills). Each `users.id` has at most one row.
- **company_profiles** – Extends organisations with `companyName`, `description`, and web presence fields.
- **agency_profiles** – Captures agency branding and focus area metadata.
- **freelancer_profiles** – Holds rate cards, availability, and currency selections.

The consolidated view exposes shared columns:

| Column | Source | Notes |
| --- | --- | --- |
| `id` | Underlying profile table | Native primary key. |
| `userId` | Underlying profile table | Foreign key to `users`. |
| `profileType` | Derived | `member`, `company`, `agency`, or `freelancer`. |
| `title` | Headline / business name / rate card title | Normalised label for dashboards. |
| `description` | Bio / organisation focus / availability | Text snapshot for search indexing. |
| `createdAt`, `updatedAt` | Underlying table | Supports freshness filtering.

Covering indexes added in the same migration optimise common lookups:

- `profiles_updated_at_idx` accelerates chronology filters in dashboards.
- `profiles_visibility_updated_idx` powers combined visibility + freshness queries when the visibility enum column (stored as `profileVisibility` in legacy snapshots and `profile_visibility` in newer deployments) is present; environments without the column skip this index automatically.
- `company_profiles_name_idx` and `freelancer_profiles_title_availability_idx` support auto-complete and staffing searches.

This documentation should be regenerated whenever new persona-specific tables are added so the unified view and indexes continue to reflect the production schema.
