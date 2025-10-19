# Seeder Updates

## 20241120103000-foundational-persona-seed.cjs
- Seeds six core personas (operations admin, freelancer, agency lead, enterprise talent lead, mentor, volunteer) with hashed passwords, pricing tiers, skill taxonomies, and regional context for analytics baselines.
- Populates downstream domain tables (gigs, jobs, projects, experience launchpads, volunteering roles, feed posts, groups, memberships, connections) to unblock dashboard widgets, recommendation tests, and community moderation flows.
- Uses deterministic IDs so QA scripts and integration tests can reference stable records when validating CRUD, policy acknowledgement, and pricing logic.
- Executes inside a transaction with targeted `bulkDelete` statements to support idempotent reseeding across environments.
