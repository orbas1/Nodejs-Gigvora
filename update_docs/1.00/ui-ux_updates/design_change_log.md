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
- **Experience Launchpad (Aug 26):** Cohort page now features readiness scoring badges, operations insight cards (pipeline, placements, interviews, employer briefs), and production-ready talent/employer forms annotated with analytics tags and accessibility notes. Talent flows auto-populate profile context, enforce compliance uploads, and emit drop-off telemetry, while employer briefs drive SLA countdown chips, CRM webhooks, and recommended track pills surfaced by the backend scoring service.
- **Volunteers Hub (Aug 27):** Introduced invitation manager table, commitment timeline, impact insights (hours logged, beneficiaries reached), safeguarding checklist, and recommendation carousel wired to the new volunteer service payloads. UI covers accept/decline/waive flows with compliance prompts (DBS, liability waivers), offline hour logging support, and analytics emitters for participation, all mirrored across React, Flutter, and provider artefacts.
- **Trust Center:** Introduced operations dashboard layout featuring escrow KPI tiles, release queue table, dispute cards, and Cloudflare R2 evidence messaging aligned to the blue design system.
- **Trust Center (Aug 09):** Finalised KPI thresholds, operations copy, and evidence health messaging to mirror the signed-off runbook, ensuring design artefacts match the shipped React implementation.
- **Agency finance distribution (Sep 25):** Added payments dashboard blueprint with payout batch hero cards, outstanding split status chips, teammate allocation donut, export readiness checklist, and ledger export CTA patterns tied to the new agency finance payloads. Copy emphasises audit trails, export retention, and compliance triggers while accessibility notes cover keyboard reordering, focus management, and screen reader descriptions for currency deltas.
- **Auth & Admin:** Registration split between individual/company, each using stepped forms with helper text; admin login emphasises secure entry with accent callouts and audit reminders.
- **Documentation suite:** Version 1.00 now includes detailed component, styling, page, and data specifications under `Web Application Design Update/Version 1.00 update/` for engineering hand-off.
- **Auto-Assign (Aug 24):** Introduced queue page, scorecard drawer, and eligibility banners. Designs consume backend scoring payloads (skills, availability, launchpad) and surface countdown-aware actions with accessibility annotations, unlocking React implementation of the new auto-assign engine.
- **Project management workspace (Aug 26):** Added dedicated project detail canvas combining metadata editing cards, fairness weight sliders, queue snapshot tiles, and activity log timelines so regenerative auto-assign flows and programme analytics share a unified blueprint across web and Flutter.
- **Profile experience (Aug 31):** Editor overlay now consumes the sanitised skill JSON payload, renders trust-score breakdown chips, availability banners, and reference cards with compliance copy that matches the hardened backend service—ensuring Experience Launchpad and Volunteer dashboards display consistent readiness signals.
- **Profile trust insights (Sep 10):** Updated breakdown chips, tooltip copy, tier colours, and analytics tags to mirror the recalibrated 100-point weighting (foundation, social proof, Launchpad readiness, volunteer impact, jobs delivery, availability freshness, compliance) and surfaced review cadence banners aligned with backend guidance.
- **Profile engagement metrics (Sep 15):** Introduced likes/followers chips with live counter states, stale-data alerts, and queue status affordances tied to the new engagement aggregation worker so Launchpad targeting cards and volunteer recommendations mirror production metrics.
- **Profile analytics instrumentation (Sep 18):** Added blueprint for trust delta, engagement refresh, and funnel stage events with UI annotations so dashboards, targeting rails, and profile insights surface telemetry that matches the backend analytics schema.

## User Mobile App Updates
- **Navigation:** GoRouter initialises at feed; tab-style menu extends to explorer, marketplace verticals, launchpad, volunteering, profile, and admin entry.
- **Feed & Explorer:** Pull-to-refresh lists, offline/cached banners, skeleton loaders, and analytics-tracked interactions help users stay informed even with intermittent connectivity.
- **Marketplace:** Shared `OpportunityListScreen` orchestrates jobs/gigs/projects/launchpad/volunteering with search, chips, CTA buttons, and empty-state cards tailored per category.
- **Profile & Auth:** Profile screen surfaces card-based metrics, while auth flows support freelancer + company registration, emphasising KYC readiness.
- **Auto-Assign queue:** Added dedicated queue screen with countdown chips, score breakdown, and preference management overlays synchronised with the new backend service. Offline and push-notification states documented to support Riverpod controllers and analytics tagging.
- **Volunteers Hub:** Mobile dashboard mirrors web invitation management, commitment logging, and impact widgets with offline caching for hour entries, volunteer waiver acknowledgement surfaces, and haptic cues when commitments are confirmed or expire.

## Provider App Updates
- Provider dashboard wireframes introduce pipeline summaries (applications, invites, milestones), quick actions (post opportunity, create launchpad), and compliance banners (escrow status, dispute alerts).
- Opportunity management emphasises multi-step forms with save states, preview modals, and scheduling pickers for interviews / project milestones.
- Analytics overlays include ads performance, launchpad throughput, and volunteer impact cards with sparkline visualisations, all using shared accent palettes.
- Auto-assign hub now mapped with queue table, override modal, KPI cards, and decline-feedback loop to power recruiter decisioning. Designs specify SLA breach states, manual promotion triggers, and audit logging copy that align with the newly merged Node.js endpoints.
- Volunteers staffing console mirrors the web Volunteer Hub, exposing allocation matrix, safeguarding alerts, impact exports, and invite escalation workflows so agencies can triage non-responses and hour variance breaches using the same analytics definitions as operations dashboards.
- Finance control tower module pairs revenue stat tiles, payout distribution charts, runway reserve gauges, and tax/export badges with upcoming batch previews to give provider finance teams a command centre aligned with the new finance payload and React implementation.

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
