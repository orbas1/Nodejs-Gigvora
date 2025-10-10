# Dummy Data Requirements – Web Application v1.50

## Purpose
Enable realistic prototyping and testing of dashboards, forms, and workflows without exposing real customer data.

## Data Sets Needed
- **Gigs:** 25 sample gigs with varying statuses (Draft, Live, Paused), industries, rates, locations.
- **Projects:** 10 projects with milestones, tasks, attachments, assigned members.
- **Users:** 40 user profiles (talent + organisation roles) with avatars, roles, verification statuses.
- **Escrow transactions:** 50 transactions covering funded, released, disputed states with timestamps.
- **Notifications:** Sample events (application received, payout released, document expiring).
- **Resources:** 12 knowledge base entries with categories, tags, publish dates.

## Data Structure Notes
- Provide IDs formatted as UUID v4 strings.
- Include ISO 8601 timestamps with timezone offsets.
- Amount fields use decimal with currency code (ISO 4217).

## Compliance
- Ensure dummy data uses fictitious names and placeholder emails (`example.com`).
- Provide script to reset data between sessions for consistent demos.
