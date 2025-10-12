# Design Change Log – Version 1.00

## Overview
- Version 1.00 delivers a unified blue-forward design system across web and mobile, aligning typography (Inter), rounded geometry, and elevated cards with shared accent gradients.
- Navigation, discovery, and collaboration surfaces gain consistent IA: hero storytelling → personalised feeds → deep search, backed by refreshed forms and analytics call-to-actions.
- Wireframe updates cascade into interaction logic (debounced search, cached feeds, offline-safe lists) and styling tokens (surface tiers, accent chips, shadow ramps).

## Shared Design System Enhancements
- **Color tokens:** Accent primary `#2563EB`, deep accent `#1D4ED8`, soft surface `#F8FAFC`, and slate neutrals anchor both Tailwind utility classes on web and Flutter theme definitions for buttons, chips, and input borders.
- **Typography:** Inter remains platform-wide with weight ramps (500–700) for headers, ensuring legibility in hero headlines, dashboard metrics, and CTA labels.
- **Components:** Card elevations standardised (24px radius / 30px blur), pill buttons, status banners, chips, and bordered pills reused across feed, search, launchpad, and volunteering modules.
- **Illustrative gradients:** Radial backdrops and blurred accent orbs added to hero, feed, and search backgrounds to create depth while maintaining WCAG contrast for text overlays.
- **Token runtime loader:** Flutter apps now consume the JSON token exports via a dedicated design-system package, ensuring colour, spacing, and typography stay in lockstep with the React implementation.

## Web Application Updates
- **Messaging entrypoint:** Floating chat bubble persists across layouts with unread count badge, support shortcut, and search/composer modal linking to the authenticated messaging centre.
- **Engagement feed:** Card template now exposes viewer reaction state, share confirmations, moderation badges, and analytics-friendly metadata rows shared with mobile.
- **Main layout:** Sticky header with responsive nav, floating accent underline for active routes, gradient-backed body, and CTA cluster (`Login`, `Join Now`).
- **Homepage:** Hero emphasises marketplace narrative, feed teaser card, metrics row, and CTA pair; partner logos, feature cards, and testimonials align to 3/4-column grids for scannability.
- **Discovery surfaces:** Search uses segmented category tabs, debounced query inputs, caching state banners, and card-based result grid with meta chips. Jobs/gigs/projects/volunteering pages inherit filtered list patterns and CTA scaffolds for deeper detail views, now wired to Meilisearch freshness scoring, remote badges, and synonym-driven chip groupings to mirror backend ranking.
- **Community:** Launchpad, volunteering, groups, and connections adopt section headers with badges, timeline cards, and join buttons to reinforce network-first behaviour.
- **Trust Center:** Introduced operations dashboard layout featuring escrow KPI tiles, release queue table, dispute cards, and Cloudflare R2 evidence messaging aligned to the blue design system.
- **Trust Center (Aug 09):** Finalised KPI thresholds, operations copy, and evidence health messaging to mirror the signed-off runbook, ensuring design artefacts match the shipped React implementation.
- **Auth & Admin:** Registration split between individual/company, each using stepped forms with helper text; admin login emphasises secure entry with accent callouts and audit reminders.
- **Documentation suite:** Version 1.00 now includes detailed component, styling, page, and data specifications under `Web Application Design Update/Version 1.00 update/` for engineering hand-off.
- **Auto-Assign (Aug 24):** Introduced queue page, scorecard drawer, and eligibility banners. Designs consume backend scoring payloads (skills, availability, launchpad) and surface countdown-aware actions with accessibility annotations, unlocking React implementation of the new auto-assign engine.

## User Mobile App Updates
- **Navigation:** GoRouter initialises at feed; tab-style menu extends to explorer, marketplace verticals, launchpad, volunteering, profile, and admin entry.
- **Feed & Explorer:** Pull-to-refresh lists, offline/cached banners, skeleton loaders, and analytics-tracked interactions help users stay informed even with intermittent connectivity.
- **Marketplace:** Shared `OpportunityListScreen` orchestrates jobs/gigs/projects/launchpad/volunteering with search, chips, CTA buttons, and empty-state cards tailored per category.
- **Profile & Auth:** Profile screen surfaces card-based metrics, while auth flows support freelancer + company registration, emphasising KYC readiness.
- **Auto-Assign queue:** Added dedicated queue screen with countdown chips, score breakdown, and preference management overlays synchronised with the new backend service. Offline and push-notification states documented to support Riverpod controllers and analytics tagging.

## Provider App Updates
- Provider dashboard wireframes introduce pipeline summaries (applications, invites, milestones), quick actions (post opportunity, create launchpad), and compliance banners (escrow status, dispute alerts).
- Opportunity management emphasises multi-step forms with save states, preview modals, and scheduling pickers for interviews / project milestones.
- Analytics overlays include ads performance, launchpad throughput, and volunteer impact cards with sparkline visualisations, all using shared accent palettes.
- Auto-assign hub now mapped with queue table, override modal, KPI cards, and decline-feedback loop to power recruiter decisioning. Designs specify SLA breach states, manual promotion triggers, and audit logging copy that align with the newly merged Node.js endpoints.

## Accessibility & Quality
- Web: focus outlines preserved on nav, buttons, chips; large-touch variants for cards; ARIA labelling on CTA groups.
- Mobile: Material 3 theming ensures minimum 44px touch targets, high-contrast banners for error/offline states, and haptic cues on key actions.
- Shared design QA includes snapshot comparisons, motion guidelines (≤200ms transitions), and documentation of state variants (loading, empty, error) for all core screens.

## Detailed Page-Level Adjustments
### Web Experience
- **Feed interactions:** Redesigned feed grid with reaction palette, inline comment drawer, share modal, and moderation alerts mapped to backend payloads.
- **Opportunity details:** Dedicated page layout now mirrors listing cards—hero summary with meta chips, sticky action rail (`Apply`, `Share`, `Save`), and accordion tabs for description, requirements, compensation, FAQ, and employer snapshot.
- **Knowledge base:** Support centre reorganised into searchable collections with card previews, breadcrumb navigation, and contextual contact CTA.
- **Footer depth:** Additional columns for security, compliance, and accessibility statements plus social proof badges and certification seals.

### User Mobile App
- **Opportunity detail sheet:** Full-screen modal with hero, status badge, quick actions (Save, Apply), scrollable sections for overview, requirements, compensation, company profile, and similar opportunities carousel.
- **Launchpad detail:** Tabbed layout (Overview, Curriculum, Mentors, Updates) with sticky CTA to enrol or continue progress; progress tracker badges displayed inline.
- **Support & tickets:** Settings → Support restructured into categories, active tickets list, and escalation CTA with status icons.

### Provider App
- **Candidate review modal:** Split-pane design with candidate summary, resume preview, evaluation rubric, and decision buttons pinned to footer.
- **Ads campaign builder:** Wizard-style layout capturing objective, budget, creatives, and schedule with live preview of placement on web/mobile surfaces.
- **Compliance centre:** Dashboard view for escrow ledger, dispute resolution timeline, audit logs, and download links for compliance reports.

## Cross-Platform Documentation & Hand-off
- Updated redlines include spacing, component usage, and data binding notes per screen to reduce implementation ambiguity.
- Figma libraries synchronised with Tailwind tokens and Flutter theme classes; naming aligned for programmatic extraction.
- QA checklist expanded to cover accessibility audits, localisation readiness, and responsive stress tests down to 320px width.
