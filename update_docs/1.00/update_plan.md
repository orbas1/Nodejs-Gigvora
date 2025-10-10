# Version 1.00 – Update Plan Overview

This document summarises the execution approach for the Version 1.00 release. For the full breakdown with detailed task descriptions, consult **`Update Plan.md`** in the same directory. The focus areas below emphasise the Experience Launchpad, Volunteers hub, and Employment/Jobs board expansions that were previously under-documented.

## Programme Priorities
1. **Flutter & Mobile Parity:** Deliver modular Flutter apps with feature parity for chat, live feed, explorer/search, projects, jobs, Experience Launchpad, volunteers, and Gigvora Ads, backed by CI/CD automation.
2. **Communication & Engagement:** Upgrade messaging with floating chat bubble, inbox improvements, and LinkedIn-style live feed interactions across web, Flutter, and provider dashboards.
3. **Trust & Compliance:** Integrate FCA-compliant escrow, disputes, and Cloudflare R2 media governance with observability, security, and audit readiness.
4. **Discovery & Automation:** Deploy Meilisearch-powered explorer with advanced filters surfacing launchpad and volunteer opportunities, launch the auto-assign engine, Experience Launchpad workflows, and the Volunteers hub.
5. **Profiles & Employment:** Refactor profiles with new sections, trust score, likes/follows, and availability toggles; expand agency/company dashboards and the Employment/Jobs board (including launchpad and volunteer listings, ATS automation, and CV tooling).
6. **Project & Operations Management:** Enhance project and gig creation, ship a comprehensive project management module, and embed volunteer staffing/launchpad insights.
7. **Monetisation & Brand:** Rebuild homepage and design systems in blue theming, and introduce the Gigvora Ads suite with Cloudflare R2-backed asset pipelines.

## Milestones Snapshot
- **Milestone 1 – Foundations:** Vendor contracting, environment setup, issue discovery, architecture baselines.
- **Milestone 2 – Core Experiences:** Flutter foundations, chat/live feed parity, homepage redesign, profile refactor with availability toggles.
- **Milestone 3 – Trust & Automation:** Escrow/disputes rollout, Meilisearch productionisation, auto-assign launch, Experience Launchpad and Volunteers hub go-live.
- **Milestone 4 – User Archetypes:** Agency/company dashboards, project management module, Employment/Jobs board + launchpad/volunteer expansion.
- **Milestone 5 – Launch:** Full regression, compliance sign-off, marketing enablement, phased rollout, and hypercare.

## Progress Tracking
Progress across Security, Completion, Integration, Functionality, Error Free, Production, and Overall readiness is maintained in `update_progress_tracker.md`. Tasks 4 and 5 explicitly track Experience Launchpad, Volunteers, and Employment/Jobs board deliverables to ensure visibility through each milestone.

## Next Actions
- Align squads on launchpad, volunteer, and jobs board schema changes before Milestone 2 completes.
- Schedule dedicated QA scripts for launchpad auto-matching, volunteer invitations, and jobs board application flows as part of Milestone 3 readiness gates.
- Keep change logs, end-of-update report, and release collateral updated with launchpad, volunteer, and jobs board enhancements for final approval.
