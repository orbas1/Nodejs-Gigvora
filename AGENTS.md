  - [x] Subcategory 5.B. Calls & Realtime Signals
1. **Appraisal.** The realtime stack still pivots around Agora tokens generated in `createCallTokens` and consumed by the `/voice` namespace and messaging flows.【F:gigvora-backend-nodejs/src/services/agoraService.js†L1-L78】【F:gigvora-backend-nodejs/src/realtime/voiceNamespace.js†L1-L94】 Frontend orchestration happens inside `MessagingDock.jsx` and `DashboardInboxWorkspace.jsx`, which mount the shared `AgoraCallPanel.jsx` for live sessions.【F:gigvora-frontend-reactjs/src/components/messaging/MessagingDock.jsx†L320-L372】【F:gigvora-frontend-reactjs/src/features/inbox/DashboardInboxWorkspace.jsx†L332-L367】【F:gigvora-frontend-reactjs/src/components/messaging/AgoraCallPanel.jsx†L1-L120】 The baseline experience is functional but lacks pre-call diagnostics, enterprise quality badges, or branded transitions comparable to Meta Workplace or LinkedIn Live Rooms. A premium appraisal focuses on elevating trust, polish, and resilience across device families.
   - *Security & Compliance.* Harden token issuance by rotating Agora credentials, logging issuance inside the audit trail, and validating namespace room quotas before joining.
   - *Accessibility.* Introduce focus traps, keyboard shortcuts, and live-region updates so the `AgoraCallPanel` controls match WCAG 2.2 AA expectations instead of relying solely on iconography.
   - *Competitive Benchmark.* Benchmark host controls, screen sharing, and analytics overlays against LinkedIn Events, Zoom Team Chat, and Meta Workplace to map capability gaps.
   - *Future Readiness.* Design an abstraction that can swap Agora for a first-party SFU without rewriting `MessagingDock` or Flutter repositories, ensuring smooth vendor transitions.
   - *Frontend Surface.* Validate render paths through `AppLayout` and floating docks, confirming zero layout shift when the call panel enters/exits across dashboard, inbox, and mobile shells.
   - *Backend Foundation.* Stress the `/voice` namespace admission checks, room occupancy limits, and exception handling so an invalid credential never surfaces as a silent failure to the UI.
   - *Data & Analytics.* Wire call lifecycle events into analytics so join/leave/quality metrics are captured alongside `recordCallParticipantJoin` updates for downstream dashboards.
   - *UX & Brand.* Introduce executive-ready motion, typography, and lighting (e.g., frosted glass, depth cues) so the call dock feels as aspirational as the rest of the Gigvora brand system.
2. **Functionality.** Call sessions are created through `POST /messaging/threads/:id/calls`, which invokes `startOrJoinCall` to mint channel names, persist event messages, and deliver tokens back to the client.【F:gigvora-backend-nodejs/src/controllers/messagingController.js†L347-L363】【F:gigvora-backend-nodejs/src/services/messagingService.js†L1025-L1115】 React and Flutter clients call the same service via `createCallSession`, then hydrate `AgoraCallPanel` to manage publishing, mute toggles, and layout of remote participants.【F:gigvora-frontend-reactjs/src/services/messaging.js†L85-L103】【F:gigvora-frontend-reactjs/src/components/messaging/AgoraCallPanel.jsx†L121-L216】 Functionality reviews must guarantee every journey—from start, join, reconnection, to teardown—works deterministically across browsers, mobile, and poor networks.
   - *Service Contracts.* Document the REST + socket contracts, including call types, roles, TTLs, and error surfaces so client libraries can generate typed SDKs.
   - *State Persistence.* Persist device preferences, mute states, and last-used call mode per thread so re-joins respect user intent beyond the current memory store.
   - *Notifications.* Enrich system messages broadcast from `startOrJoinCall` with structured metadata and push notifications so missed calls surface instantly.
   - *Lifecycle Hooks.* Align cron/worker processes that clean expired call metadata with socket disconnect handling to avoid ghost sessions lingering in message history.
   - *User Journeys.* Map deep links (e.g., join from notification), scheduled mentor sessions, and ad-hoc huddles to ensure the same capability set is available everywhere.
   - *System Integrations.* Catalogue dependencies on `voiceNamespace`, inbox state loaders, analytics pipelines, and future whiteboard/recording services to avoid regressions when refactoring.
   - *Edge Conditions.* Simulate permission revocation, token expiry, device denial, and multi-tab joins so guardrails surface actionable recovery copy instead of silent failures.
   - *Cross-Platform.* Keep Flutter controllers and React contexts in parity, including error strings, haptic feedback, and call quality statuses for mobile parity.
3. **Logic Usefulness.** Business logic wraps call events into message threads, recording participants, expiry, and last joined timestamps to keep asynchronous and synchronous touchpoints aligned.【F:gigvora-backend-nodejs/src/services/messagingService.js†L664-L738】【F:gigvora-backend-nodejs/src/services/messagingService.js†L1093-L1114】 `voiceNamespace` enforces room whitelists and participant caps, yet lacks tier-aware throttles, KPI routing, or context-aware escalation. Logic usefulness work ensures every decision (who can host, when to expire, how to sync presence) supports mentors, recruiters, and founders.
   - *Personalisation.* Extend `normalizeCallType` and room selection so executive cohorts see premium codecs, branded waiting rooms, or concierge join flows based on role.
   - *Conflict Resolution.* Build optimistic concurrency around `recordCallParticipantJoin` and socket joins to avoid race conditions when multiple devices join simultaneously.
   - *Scenario Coverage.* Test peak scenarios such as all-hands townhalls or mentor summits where hundreds of invitations go out, ensuring bandwidth controls and messaging updates stay aligned.
   - *Data Provenance.* Surface channel IDs, host IDs, and expiry metadata in telemetry dashboards so audits can reconstruct who joined and when without digging into raw JSON.
   - *Decision Trees.* Document gating logic controlling voice vs. video vs. future screen-share capabilities so policy updates do not require spelunking through service code.
   - *Business Alignment.* Tie call nudges (e.g., prompt to follow up with a proposal) into opportunity funnels so calls measurably accelerate hires or mentor engagement.
   - *Observability.* Emit structured logs and traces for join latency, token issuance failures, and SDK errors to feed SLO dashboards and proactive pager duty alerts.
   - *Recovery Paths.* Offer resume options when tokens expire mid-call by rotating credentials server-side and rejoining automatically instead of forcing manual restarts.
4. **Redundancies.** Call orchestration logic is repeated across `MessagingDock`, `useInboxController`, and dashboard workspaces, each managing their own `callSession` state and inbox refreshes.【F:gigvora-frontend-reactjs/src/components/messaging/MessagingDock.jsx†L320-L368】【F:gigvora-frontend-reactjs/src/features/inbox/useInboxController.js†L472-L514】【F:gigvora-frontend-reactjs/src/features/inbox/DashboardInboxWorkspace.jsx†L332-L371】 The same `AgoraCallPanel` is mounted in three surfaces with near-identical chrome. Redundancy cleanup should centralise orchestration and styling primitives.
   - *Dependency Graph.* Visualise where call state, toast handling, and analytics tracking live to consolidate into a single messaging-call controller.
   - *Documentation.* Update runbooks so support teams refer to one canonical flow when diagnosing call issues across inbox, dashboards, and mobile.
   - *Design Tokens.* Replace locally-defined spacing/colour tokens for call cards with system tokens to avoid drift between workspaces.
   - *Analytics Events.* Deduplicate event names (`call.started`, `call.joined`) so dashboards aggregate across entry points without manual stitching.
   - *Code Review.* Extract `startCall`/`joinCall` helpers into a shared hook and share the same store slice rather than duplicating `useState` logic per component.
   - *Schema Review.* Collapse redundant metadata fields inside message records so downstream warehousing does not maintain duplicate call footprints.
   - *UI Audit.* Merge call modals and drawers into a single adaptive component with slot-based composition for admin vs. mentor contexts.
   - *Process Review.* Assign one squad clear ownership of call surfaces to prevent parallel implementations diverging again.
5. **Placeholders Or non-working functions or stubs.** Several safeguards still read as temporary scaffolding. `voiceNamespace` returns “Voice infrastructure is not fully configured” whenever token generation fails, and no user-facing remediation is provided.【F:gigvora-backend-nodejs/src/realtime/voiceNamespace.js†L53-L86】 Tests mock Agora without verifying production fallback behaviour, and no pre-call hardware checks exist, leaving a gap between expectation and actual readiness.
   - *Feature Flags.* Catalogue messaging feature flags gating call rollout, ensure they have expiry dates, and document rollback plans.
   - *Testing Coverage.* Replace broad Jest mocks with integration tests that assert call setup works with real config plus failure-mode expectations.
   - *Docs & Training.* Update support playbooks to remove references to third-party consoles or deprecated Agora dashboards.
   - *Data Migration.* Backfill call metadata for historic threads missing structured `metadata.call` blocks so analytics works retroactively.
   - *Code Flags.* Remove legacy comments and TODOs referencing “switch provider” once abstraction layers are in place.
   - *Data Seeds.* Refresh fixtures so demo environments show realistic mentor/founder call histories with active participants.
   - *UI States.* Replace placeholder waiting messages with contextual copy (e.g., “Mentor joining shortly”) and branded illustrations.
   - *Operational Hooks.* Monitor runtime config and secrets on boot; fail fast with actionable observability instead of user-facing placeholder errors.
6. **Duplicate Functions.** `MessagingDock`, `useInboxController`, and Flutter controllers each re-implement `startCall` and `joinCall` flows, including identical error parsing and inbox refresh logic.【F:gigvora-frontend-reactjs/src/components/messaging/MessagingDock.jsx†L320-L368】【F:gigvora-frontend-reactjs/src/features/inbox/useInboxController.js†L472-L514】【F:gigvora-flutter-phoneapp/lib/features/messaging/application/messaging_controller.dart†L560-L598】 Centralising these flows reduces drift and opens room for richer analytics hooks.
   - *GraphQL/REST Normalisation.* Funnel all clients through a typed SDK (TS + Dart) that wraps REST endpoints and sockets with shared retry logic.
   - *Styling Utils.* Move button/label treatments into a call-specific design token file used by both `AgoraCallPanel` and modal launchers.
   - *Mobile Parity.* Ensure Flutter shares the same orchestration helpers so toggling mute/video uses identical semantics and analytics hooks.
   - *Domain Events.* Publish consistent domain events when calls start/end, avoiding ad-hoc emitter code in each controller.
   - *Service Layer.* Consolidate server-side validation (`normalizeCallType`, `buildCallChannelName`) into a dedicated module consumed by controllers and workers.
   - *Client Utilities.* Provide a `useCallSession` hook/context for React and equivalent provider on Flutter to standardise lifecycle management.
   - *Notification Templates.* Drive all call notifications through a single template system so copy and CTA buttons remain aligned.
   - *Testing Utilities.* Share fixtures that simulate call metadata, socket events, and token expiry across React, Node, and Flutter tests.
7. **Improvements need to make.** Ship features that broadcast premium credibility: lobby and background previews, call quality scoring, transcription, and smart nudges linking to proposals or feedback forms.
   - *Platform Alignment.* Coordinate with analytics and finance squads so call duration feeds billing, mentorship credits, or SLA tracking.
   - *User Research.* Conduct diary studies with recruiters/mentors to prioritise device checks, recordings, or breakout spaces.
   - *Documentation.* Update API docs and runbooks with new call modes (e.g., webinars, recording opt-in) so partner teams can integrate quickly.
   - *Budgeting.* Estimate CDN, TURN/SFU, and storage costs for recordings/transcriptions before committing to roadmap milestones.
   - *Technical Roadmap.* Sequence tasks: provider abstraction → shared call controller → lobby experience → analytics instrumentation.
   - *Experience Enhancements.* Add hover microcopy for controls, subtle confetti for successful deals, and cross-link to workspace summaries after calls.
   - *Design Evolution.* Refresh icons, badges, and tile layouts to echo enterprise networks—rounded corners, layered shadows, gradient accents.
   - *Measurement.* Track KPIs such as start-to-join latency, call completion rates, mentor satisfaction, and call-to-contract conversions.
8. **Styling improvements.** The current `AgoraCallPanel` relies on minimal flat styling; it should feel premium with elevated surfaces, contextual gradients, and accessible iconography.【F:gigvora-frontend-reactjs/src/components/messaging/AgoraCallPanel.jsx†L143-L216】 Styling work must respect dark mode and align with the broader design system.
   - *Component Library.* Export call controls and participant tiles into the shared component library for reuse across web/mobile/admin shells.
   - *Microstates.* Provide hover, pressed, muted, disabled, and network-warning variants with motion tokens for each button.
   - *Sound & Haptics.* Introduce subtle success/error sounds plus haptics on mobile when toggling mic/camera or when participants join.
   - *Illustrations.* Commission branded holding cards for empty rooms, waiting rooms, or recording notifications.
   - *Component Styling.* Apply consistent spacing, glassmorphism backgrounds, and typography scale to align with executive dashboards.
   - *Theme Consistency.* Audit dark, high-contrast, and colour-blind themes to ensure the call dock remains legible and on-brand.
   - *Motion Design.* Add eased transitions for participant grid changes, connecting animations, and countdown timers.
   - *Brand Expression.* Integrate accent gradients and subtle glows so the dock feels bespoke to Gigvora rather than a generic SDK wrapper.
9. **Efficiency analysis and improvement.** Every call join currently instantiates a new Agora client and re-fetches inbox threads, which is wasteful under heavy use.【F:gigvora-frontend-reactjs/src/components/messaging/MessagingDock.jsx†L320-L352】 Backend joins calculate occupancy per socket request; profiling can expose bottlenecks.
   - *Caching Strategy.* Cache reusable data like participant avatars and thread metadata when a call session starts to minimise duplicate fetches.
   - *Data Volume Tests.* Load test `voiceNamespace` with realistic concurrency to calibrate socket rooms, TTLs, and horizontal scaling policies.
   - *Resource Footprint.* Profile CPU/memory for call workers and ensure Agora SDK usage releases tracks promptly during cleanup.
   - *Cost Optimisation.* Model costs for TURN/SFU (if added) and token generation to inform pricing for premium plans.
   - *Frontend Performance.* Lazy-load Agora SDK bundles, prewarm device checks, and memoize event handlers to avoid rerenders.
   - *Backend Performance.* Optimise participant join loops and ensure `recordCallParticipantJoin` runs inside minimal transactions.
   - *Realtime Efficiency.* Batch presence events for typing/call updates so sockets stay below throughput caps during large cohorts.
   - *Operational Efficiency.* Instrument autoscaling rules for socket namespaces and background workers tied to call clean-up.
10. **Strengths to Keep.** Preserve the tight integration between calls and messaging threads, including automatic system messages, participant tracking, and cross-platform availability.【F:gigvora-backend-nodejs/src/services/messagingService.js†L1061-L1115】【F:gigvora-frontend-reactjs/src/components/messaging/AgoraCallPanel.jsx†L143-L216】 These primitives underpin trust and continuity for enterprise customers.
   - *Cultural Fit.* Highlight mentor success stories that cite seamless call follow-ups to reinforce messaging to leadership.
   - *Reusable Patterns.* Keep the call metadata schema and `AgoraCallPanel` composition so future modules (project workspace, mentorship) can embed calls quickly.
   - *Data Partnerships.* Maintain integrations with calendar/scheduling features so calls auto-sync with availability management.
   - *Team Rituals.* Continue design/dev pairing during call updates to keep latency low and QA thorough.
   - *Signature Moments.* Retain immediate availability of call recordings/messages inside the same thread timeline.
   - *Architectural Wins.* Keep modular service boundaries and token utilities that already isolate credential logic.
   - *Data Quality.* Preserve validation of call metadata (expiresAt, participants) ensuring analytics remains trustworthy.
   - *Operational Excellence.* Maintain existing observability and incident response practices for messaging so call outages remain rare.
11. **Weaknesses to remove.** The experience still lacks enterprise essentials such as pre-join checks, device selection, bandwidth indicators, and polished copy for edge cases. Error surfaces often expose raw Agora failures or generic fallbacks.
   - *Escalation History.* Review tickets relating to call token expiry, browser compatibility, and missing host tools to prioritise fixes.
   - *Shadow IT.* Identify teams resorting to Zoom/Meet due to missing Gigvora call capabilities and close gaps quickly.
   - *Data Hygiene.* Ensure participants leaving early trigger `voice:participant-left` events so stale presence does not persist.
   - *Change Drift.* Align code with product copy—remove references to deprecated external conferencing or placeholder instructions.
   - *User Pain.* Address inability to switch devices mid-call, missing breakout options, and lack of transcription.
   - *Technical Debt.* Replace ad-hoc promise chains with typed async flows and add unit tests for token expiry, join loops, and cleanup routines.
   - *Design Debt.* Tighten spacing, typography, and icon weight to remove the utilitarian feel of current controls.
   - *Risk Exposure.* Deliver encryption, compliance logging, and consent flows ahead of larger enterprise rollouts.
12. **Styling and Colour review changes.** Refresh the palette so call controls match the brand’s electric blues and violets, with adaptive states for dark mode and accessibility.
   - *Gradient Usage.* Introduce subtle gradients on active controls and participant highlights to convey depth.
   - *Accessibility Themes.* Provide high-contrast variations for all call buttons and status badges.
   - *Brand Motion.* Sync hover/active animations with the global motion spec to ensure consistency across dashboards.
   - *Print/PDF Modes.* Ensure exported call summaries maintain colour contrast when printed for compliance reviews.
   - *Palette Calibration.* Map current greys/reds used in error states to approved design tokens.
   - *Component Themes.* Share theming knobs so admin/mobile shells can tint the dock without breaking brand guidelines.
   - *Contrast Testing.* Run automated tests covering focus rings, hover states, and remote participant tags.
   - *Visual Hierarchy.* Differentiate primary call-to-action (Join, End) from secondary actions (Mute, Switch camera) with scale + colour.
13. **CSS, orientation, placement and arrangement changes.** Responsive behaviour must elevate multi-participant layouts, maintain readability on tablets/phones, and support docking/undocking in dashboard layouts.【F:gigvora-frontend-reactjs/src/components/messaging/AgoraCallPanel.jsx†L143-L216】
   - *Micro-layouts.* Refactor grids to auto-fit participant tiles with min/max widths and smooth transitions.
   - *Scroll Behaviour.* Provide snap/scroll behaviour for participant carousels when rooms exceed four attendees.
   - *Composability.* Allow surfaces to slot additional controls (recording, transcript) without forking the component.
   - *Hardware Diversity.* Optimise pointer targets for touch and stylus while preserving precision for desktop mice.
   - *Layout Systems.* Align with the 8pt spacing system and ensure the dock supports full-width vs. compact modes.
   - *Orientation Support.* Guarantee landscape/portrait rotations keep controls reachable and video tiles centred.
   - *Interaction Zones.* Expand hit areas for mic/camera toggles and introduce long-press menus for advanced settings.
   - *Internationalisation.* Reserve space for RTL labels and longer status strings without breaking layout.
14. **Text analysis, placement, length, redundancy, quality.** Audit all copy—`Video call in progress`, error states, waiting messages—to ensure clarity, brevity, and brand tone. Add explicit states (connecting, waiting for host, recording on) with supporting tooltips.【F:gigvora-frontend-reactjs/src/components/messaging/AgoraCallPanel.jsx†L165-L216】
15. **Change Checklist Tracker.** Consolidate improvement work into a living checklist that covers architecture, UX, QA, and comms.
   - *Risk Management.* Schedule threat modelling for token issuance, socket namespaces, and recording storage.
   - *Rollout Strategy.* Pilot upgraded calls with internal mentors, then staged customer cohorts using feature flags.
   - *Metrics Readiness.* Instrument dashboards tracking join latency, drop rates, and NPS for every release increment.
   - *Post-launch Support.* Prepare support macros, escalation paths, and in-product tours covering new controls and troubleshooting.
   - *Implementation Tasks.* Break down provider abstraction, shared hooks, lobby UI, analytics capture, and Flutter parity workstreams.
   - *Design Tasks.* Deliver Figma specs, motion prototypes, and accessibility reviews for the refreshed dock.
   - *Operational Tasks.* Verify runtime configs, rotate credentials, and rehearse rollback scripts before rollout.
   - *Communication Tasks.* Publish release notes, executive briefings, and enablement decks aligning on messaging and adoption goals.
16. **Full Upgrade Plan & Release Steps.** Execute the upgrade through disciplined phases so every stakeholder is aligned.
   - *Dependencies.* Finalise provider abstraction, analytics pipelines, and token rotation tooling before UI polish begins.
   - *Training.* Enable success, sales, and mentor operations teams with demos, FAQs, and troubleshooting guides.
   - *Documentation.* Ship updated API docs, runbooks, and governance policies alongside feature releases.
   - *Continuous Improvement.* Run retros after each cohort release and feed insights back into backlog prioritisation.
   - *Phase 1 – Discovery.* Research enterprise expectations, define KPIs, and secure leadership sign-off.
   - *Phase 2 – Build.* Implement shared call controller, lobby, and styling updates with continuous integration coverage.
   - *Phase 3 – Validation.* Conduct unit, integration, load, accessibility, and visual regression testing with cross-platform QA.
   - *Phase 4 – Launch & Iterate.* Roll out via feature flags, monitor telemetry, collect qualitative feedback, and iterate rapidly on any friction points.
