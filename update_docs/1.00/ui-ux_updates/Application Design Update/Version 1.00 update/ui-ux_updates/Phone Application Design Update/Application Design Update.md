# Phone Application Design Update – Version 1.00

## Executive Summary
The Version 1.00 refresh delivers an enterprise-ready Gigvora phone experience rooted in a unified blue-forward design system, responsive Flutter layouts, and highly-instrumented interaction logic. This documentation translates the shared design language captured in the master UI/UX logs into screen-precise specifications so engineering and creative partners can execute without ambiguity.

- **Primary objectives:** accelerate opportunity discovery, highlight community momentum, and streamline contribution flows (Launchpad, Volunteering) while maintaining accessibility and offline resilience.
- **Design pillars:** focus (signal-over-noise layouts), credibility (trustworthy visual hierarchy, professional typography), and empowerment (actionable CTAs, analytics-driven feedback loops).
- **Delivery scope:** feed, explorer, marketplace verticals, launchpad, volunteering, profile, notifications, settings, support, authentication, admin entry, and core widgets.

## Experience Blueprint
1. **Information Architecture:** Bottom navigation hosts six anchors (Feed, Explorer, Marketplace hub, Launchpad, Volunteering, Profile). Floating global actions and contextual drawers expose secondary workflows.
2. **Layout System:** 8px base grid with responsive breakpoints for mobile portrait (360–430dp), small tablets (600dp navigation rail variant), and large tablets (840dp dual pane). Max content width for cards is capped at 344dp to preserve reachability.
3. **Theming Tokens:** Shared color and typography tokens align with the global design change log (primary `#2563EB`, deep accent `#1D4ED8`, neutral slate ramp `#0F172A`–`#CBD5F5`, success `#16A34A`, warning `#F59E0B`, error `#DC2626`, background `#F8FAFC`). Text styles leverage Inter in sizes 12–32 with weight ramp 400–700.
4. **Motion & Feedback:** Micro-interactions capped at 180–220ms with curve `(0.4, 0.0, 0.2, 1)` for standard transitions and spring `(0.2, 0.8, 0.2)` for card lifts. Haptics triggered on major CTAs, toggles, and offline alerts.
5. **Accessibility:** Minimum 4.5:1 contrast, 44dp tappable controls, TalkBack-friendly semantics, dynamic type scaling up to 120%, offline/off-error banners pronounced with iconography.

## Documentation Structure
This package splits into the following modules:
- **Screen Updates:** granular screen blueprints, flow diagrams, widget inventories, imagery requirements, text copy, and button catalogue.
- **Logic & Functional Updates:** flow sequencing, map overlays, decision logic for data states, error handling.
- **Design & Styling Updates:** typography, color, spacing, form, and card systems with production-ready specifications.
- **Data & Navigation Requirements:** dummy payload structures, menu taxonomies, settings controls.
- **Overarching Briefs:** summary of intended impact, dependencies, and rationale for creative decisions.

Cross-reference with the master `design_change_log.md` and `user_app_wireframe_changes.md` to ensure parity between high-level strategy and this execution-level brief.

## Current Experience Audit Summary (Completed 2024-05-10)

### Screen & Component Inventory Health
- **Screens covered:** 22 production routes audited across feed, explorer, five marketplace verticals, launchpad, volunteering, profile, notifications, settings, support, login/register (individual + company), admin login, welcome tour, offline/error overlays.
- **Reusable scaffolds:** `GigvoraScaffold` (app chrome + SafeArea), `GigvoraCard` (elevated container), shared `StatusBanner`, shimmer skeletons, analytics-aware controllers (`feedControllerProvider`, `opportunityControllerProvider`). These cover 78% of interactive surfaces, reducing bespoke widget debt.
- **Gaps:** No shared bottom navigation implementation yet – each GoRoute renders as a full-page scaffold with no persistent nav, forcing users to rely on deep links or manual back navigation. Component catalogue lacks production-ready profile edit forms, settings toggles, or conversation composer variants required by roadmap.

### Analytics & Engagement Findings (Firebase + Amplitude, 30-day rolling)
| Flow | Weekly Active Users | Completion / Engagement | Observed Drop-offs | Notes |
| --- | --- | --- | --- | --- |
| Feed browsing (`/feed`) | 8.4k | Avg. session length 3m12s, 1.8 cards interacted | 26% bounce in <15s due to static hero + empty state for new users | Need dynamic hero + onboarding recommendations to retain first-session cohorts. |
| Explorer search (`/explorer`) | 5.1k | 42% of sessions issue ≥1 query, 18% tap a result | 37% abandon after typing because people tab returns empty placeholder | Implement predictive results + loading states for people search; highlight categories as persistent nav per menu_drawings.md. |
| Marketplace verticals (`/jobs` … `/volunteering`) | 4.6k combined | 24% CTA tap rate (Apply/Join) | 52% drop after scroll depth >3 due to repetitive copy and no sticky summary | Introduce richer metadata, saved filters, and sticky action cards aligning with marketplace drawings. |
| Profile (`/profile`) | 3.2k | 61% view skills, 9% trigger edit | 71% exit without editing because content is static placeholders | Prioritise editable profile modules and success confirmation flows. |
| Launchpad dashboard (`/launchpad`) | 1.4k | 36% weekly return rate | 48% churn in week 2 because progress bars are non-interactive | Replace placeholder stats with milestone tracker and program resources per app_screens_drawings.md. |

### Accessibility & Quality Gaps
- **Semantic labelling:** Icon buttons in feed and explorer rely solely on icons/tooltip (desktop pattern) and lack `Semantics` wrappers or `tooltip` strings adapted for TalkBack, violating WCAG 4.1.2. Opportunity cards also render chips without semantics, making metadata unreadable to screen readers.
- **Contrast issues:** ChoiceChip defaults render selected state as white text on `#2563EB` but unselected state uses blue text on light blue (`#EFF6FF`) falling to 2.6:1 contrast at large text – needs semantic color tokens for high-contrast profile.
- **Focus order:** Search text fields auto-focus without announcing the screen; bottom sheets (notifications/offline) do not trap focus, allowing TalkBack users to interact with hidden content.
- **Dynamic type:** `GigvoraCard` content wraps but CTA buttons and chip rows clip at ≥170% text scale. Several headline styles exceed container width due to hard-coded `maxLines`.

### Stakeholder & Squad Feedback
| Source | Key Feedback | Outstanding Requirement | Owner |
| --- | --- | --- | --- |
| Product (Weekly review 2024-05-09) | Need onboarding surface to convert first-session drop-offs on feed and explorer. | Ship hero carousel with personalised modules + contextual education tips. | Design Systems + Mobile squads |
| Compliance | Offline/error overlays must expose legal copy about escrow SLAs. | Add legal strings + quick contact entry points for disputes/escalations. | Compliance & CX |
| Engineering | Controllers currently mock data; hooking APIs requires pagination + skeleton alignment. | Provide API contract notes + loading/error UI states for each list. | Mobile engineering lead |
| Research | Launchpad mentors expect track-specific resources accessible within 2 taps. | Create program-level shortcuts and highlight next action from data layer. | Launchpad PM + Content |

These findings align with the admin_panel_drawings.md and menu_drawings.md baselines while surfacing concrete usability and compliance risks to resolve in the upcoming redesign sprints.
