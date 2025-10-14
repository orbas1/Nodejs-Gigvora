# Dummy Data Requirements — Web Application v1.50

## Purpose
Supply realistic, anonymised data for marketing site prototypes, animations, and analytics visualisations.

## Data Sets Needed
1. **Testimonials** — Names, roles, company types, results metrics, quotes, headshots.
2. **Case Studies** — Industry, challenge, solution, outcomes, KPIs.
3. **Pricing Plans** — Feature lists, plan tiers, billing amounts, add-ons.
4. **Resource Library** — Titles, categories, publish dates, authors, reading time.
5. **Events & Webinars** — Title, date/time, speakers, registration link, status.
6. **Analytics Widgets** — KPI values, trends, comparison data for logged-in dashboard.

## Volume Targets
- Testimonials: 15 entries spanning industries.
- Case studies: 6 entries with varying metrics.
- Resources: 40 entries across blog, whitepaper, webinar categories.
- Events: 8 upcoming, 6 past with recordings.
- Analytics: 6 months of weekly data for sample metrics.

## Privacy & Compliance
- Generate fictional names and companies; avoid real customer references without approval.
- Provide placeholder logos/avatars designed in-house to prevent trademark issues.
- Ensure quotes are crafted by copy team; clearly mark as sample for prototypes.

## Asset Delivery
- Store JSON/Markdown files in `/web/dummy-data/v1.50/` with version control.
- Provide CDN-hosted images compressed for web (≤120KB each).
- Document schema for each dataset to align with CMS or front-end expectations.

## Maintenance
- Update dataset quarterly aligned with marketing campaigns.
- Maintain changelog noting additions, removals, and modifications.
- Automate data seeding for staging environments via script.

## Testing
- Validate dataset coverage in prototypes to avoid repetition.
- Ensure localised copy placeholders included (EN/ES/FR/PT).
- Check accessibility of alt text and captions for all imagery.
