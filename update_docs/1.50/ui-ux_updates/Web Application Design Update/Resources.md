# Resources Hub Specification – Web Application v1.50

## Purpose
Provide curated knowledge base, templates, and partner tools accessible from web dashboard.

## Content Types
- **Guides:** Long-form articles with step-by-step instructions (Onboarding, Compliance).
- **Templates:** Downloadable docs (contract templates, briefing decks).
- **Webinars & Events:** Embedded video or upcoming session schedule with registration.
- **Partner Tools:** Cards linking to integration partners with benefits summary.

## Layout
- Filter chips for categories (Hiring, Compliance, Payments, Community).
- Search bar with auto-suggestions and history.
- Featured resource hero card with large image and CTA.
- Resource list uses card layout with tags, reading time, updated date.

## Integration
- Pulls content via CMS API; caches for offline access.
- Items maintain `is-new` badges for 7 days after publish.
- Provide share button to copy link or email team.
