# Version 1.50 Design Update Milestones

## Milestone 1 – Token & Theme Architecture Finalisation (Week 1–2)
**Objective:** Ship unified design tokens, emo theme variations, and accessibility-compliant palettes across app and web.
- Publish colour/typography/spacing/elevation tokens to shared libraries and engineering packages.
- Validate high-contrast and emo themes with automated contrast testing and manual review.
- Document theme switching guidelines, fallback behaviors, and partial compatibility in design system docs.

## Milestone 2 – Application Experience Blueprinting (Week 2–4)
**Objective:** Reorganise authenticated application screens per persona, updating widgets, logic flows, and copy.
- Finalise screen inventories (`Screens_list.md`) and priority zones per persona.
- Deliver annotated wireframes for dashboards, studios, finance flows, and settings.
- Align widget functions, states, and API expectations through `Screens_Updates_widget_functions.md` updates.
- **Status 05 Apr:** Architecture domain map annotated with auth/marketplace/platform ownership, and feature flag management wireframes drafted for dashboard integration; ERD visual refresh pending stakeholder review.
- **Status 06 Apr:** Added domain registry observability panels to dashboard specs, linking `/api/domains` metadata to design annotations and TypeScript contract references.
- **Status 07 Apr:** Runtime telemetry panel designs now capture `/api/admin/runtime/health` outputs with dependency badges, rate-limit trend bars, and localisation-ready incident copy. Accessibility notes cover screen-reader announcements and focus management for manual refresh interactions.
- **Status 10 Apr:** Admin maintenance registry and cross-platform downtime banners specced, including lifecycle toasts, dismissal controls, and mobile drawer guidance tied to the new runtime maintenance APIs. QA checklist updated with aria-live and localisation scenarios.
- **Status 13 Apr:** Admin runtime dashboards now include database pool gauges and shutdown confirmation overlays aligned with the new lifecycle service; accessibility annotations capture ARIA labels for connection metrics and audit toasts.
- **Status 14 Apr:** Added the runtime specification download CTA to dashboard specs with tooltip/empty-state behaviour mapped to `/api/docs/runtime-security`, and logged localisation requirements for the new action across English, French, and Spanish.
- **Status 15 Apr:** Documented the WAF insights card (rule leaderboard, top sources, security badge states) and Flutter security snackbar triggered by runtime WAF blocks, completing the runtime telemetry spec set for admin dashboards and mobile bootstrap flows.

- **Status 17 Apr:** Finalised WAF telemetry handoffs with environment-driven rule notes, admin card data bindings, and Flutter snackbar localisation tokens so engineering can wire the new `/api/admin/runtime/health.waf` payload without additional design rounds.
- **Status 18 Apr:** Documented auto-block telemetry states (active quarantines, countdown timers, escalation copy) across admin dashboards and Flutter snackbars, completing the design package for the `waf.autoBlock` schema and unblocking implementation reviews.
- **Status 19 Apr:** Prometheus exporter telemetry card, scrape freshness indicators, and runbook CTAs documented for admin dashboards and Flutter alerts, ensuring `/health/metrics` coverage and localisation tokens are ready for implementation handoff.
- **Status 23 Apr:** Governance registry card and drill-down drawer specs shipped for
  web and Flutter, mapping `/api/domains/governance` payloads to remediation badges,
  steward contact chips, and analytics hooks so engineering can implement the new
  dashboards without follow-up design cycles.
- **Status 29 Apr:** RBAC guardrail matrix panel defined with persona summary tiles,
  guardrail/resource grids, error/empty guidance, and analytics annotations across
  `Dashboard Designs.md`, `Screens_Updates_widget_functions.md`, and
  `App_screens_drawings.md`, preparing React and Flutter teams to ship the new
  governance telemetry without additional review loops.

## Milestone 3 – Web Marketing & Dashboard Refresh (Week 3–5)
**Objective:** Modernise marketing site, landing hero, and authenticated dashboards with modular partials.
- Redesign home page hero, testimonials, pricing, and CTA placements using new component tokens.
- Expand supporting pages (Community, Compliance, Careers) using partial catalog.
- Update web dashboards (marketing + authenticated) to match refreshed component styling and data density guidelines.

## Milestone 4 – Theme & Partial Infrastructure Enablement (Week 4–6)
**Objective:** Implement runtime theme toggles, emo kits, and partial-driven page assembly.
- Configure CMS slots and template wrappers for theme injection.
- Produce emo-theme asset packs (imagery, copy tone, icon overlays) with compliance validation.
- Deliver QA checklist covering theme permutations across responsive breakpoints.

## Milestone 5 – Governance, Accessibility, and Security Enhancements (Week 5–6)
**Objective:** Ensure design outputs respect compliance, accessibility, and security guidelines across surfaces.
- Audit consent, legal, and security flows to confirm overlays, banners, and copy updates.
- Run accessibility sweeps (WCAG AA) on redesigned screens, documenting remediation steps.
- Provide security-sensitive UI patterns for finance, identity verification, and audit trails.
- **Status 04 Apr:** Maintenance-mode messaging, health telemetry widgets, and rate-limit callouts are specced with localisation guidance; pending review includes integrating the assets into emo theme variations and validating screen-reader announcements.
- **Status 07 Apr:** Operations playbook overlays incorporate runtime telemetry alerts, and compliance approved the admin dashboard copy deck; remaining scope focuses on emo theme permutations and security sign-off for provider maintenance workflows.
- **Status 10 Apr:** Maintenance announcement localisation packs, accessibility annotations, and incident analytics hooks delivered to engineering; pending actions limited to regulator artefact bundling.
- **Status 11 Apr:** Payments and compliance guard downtime states specced for finance dashboards and compliance locker workflows, including request ID surfacing and legal escalation copy; awaiting localisation sign-off for translated guard messaging.
- **Status 10 Apr:** Custodial outage messaging, disabled CTA states, and Flutter wallet overlays were documented for finance/compliance journeys, aligning UI responses with the new backend dependency guards and feeding the admin runtime panel escalation copy.
- **Status 11 Apr:** Harmonised refresh-token error copy and maintenance banners across web admin and Flutter splash/login flows, with updated artefacts in `Screen_text.md`, `App_screens_drawings.md`, and `Dashboard Designs.md` so the runtime telemetry redesign and mobile bootstrapper share consistent UX.
- **Status 12 Apr:** Added API perimeter analytics card specifications, maintenance contact chips, and perimeter audit annotations to `Dashboard Designs.md`, `Design Plan.md`, and Flutter screen artefacts so abuse telemetry and escalation copy align across surfaces.
- **Status 15 Apr:** Finalised security alert visuals for WAF incidents, including localisation-ready copy, shield iconography, and accessibility notes for snackbar/toast announcements across web and Flutter surfaces.
- **Status 17 Apr:** Added SOC-focused annotations describing how WAF metrics feed alerting dashboards and documented fallback copy when block volume is zero, ensuring QA checks include low/no-data states.
- **Status 18 Apr:** Captured auto-block escalation workflows, review guidance, and localisation notes so compliance, SOC, and support teams have consistent copy when automated quarantines trigger; QA scripts updated to verify countdown timers and accessible announcements.
- **Status 16 Apr:** Logged shutdown/drain verdict chips and runbook copy updates tied to the new backend orchestrator so operators and Flutter maintenance drawers surface drain failure guidance during planned outages.
- **Status 23 Apr:** Added governance stewardship lexicon, remediation copy, and
  accessibility annotations to cover the new admin/mobile governance widgets; QA
  checklist now includes overdue review highlighting, empty-state localisation, and
  voice-over expectations for steward contact chips.
- **Status 27 Apr:** Consent governance console, privacy console toggles, SAR
  workflows, and Flutter consent card specs completed across `Dashboard Designs.md`,
  `Settings Dashboard.md`, `Screen_text.md`, `App_screens_drawings.md`, and
  `Screens_Update_Plan.md`, leaving only emo theme contrast validation and regulator
  artefact bundling before Task 9 closure.

## Milestone 6 – Handoff, QA, and Implementation Support (Week 6–7)
**Objective:** Equip engineering and QA teams with detailed documentation, assets, and review rituals.
- Compile developer handoff packages (redlines, token JSON, component usage, logic diagrams).
- Facilitate design QA walkthroughs and backlog triage with engineering squads.
- Monitor implementation progress, capture change requests, and prepare launch communications.
