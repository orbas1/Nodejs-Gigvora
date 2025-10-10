# Screen Update Plan – Phone Application v1.00

## Delivery Phases
1. **Foundation (Sprint 1):**
   - Implement shared layout scaffolds (bottom navigation, app bars, hero headers) with theming tokens.
   - Build reusable widgets: `GigvoraCard`, `FilterChipRow`, `OfflineBanner`, `SegmentedTabBar`.
   - Establish storybook-style component gallery for QA (Flutter `storybook_flutter`).
2. **Core Surfaces (Sprint 2):**
   - Feed, Explorer, Marketplace hub, Jobs/Gigs/Projects lists.
   - Integrate analytics instrumentation + offline caching states.
   - Validate skeleton loaders and empty states.
3. **Depth Screens (Sprint 3):**
   - Opportunity detail, Launchpad dashboard, Volunteering dashboard, Profile & Portfolio.
   - Hook in progress trackers, timeline widgets, share/export actions.
4. **Supportive Flows (Sprint 4):**
   - Notifications, Inbox, Settings, Support hub.
   - Authentication suite and admin login dark-mode variant.
   - Offline/error overlays, welcome tour carousel.

## Collaboration Workflow
- **Design handoff:** Figma sources exported to Zeplin with component measurements annotated; Flutter design tokens imported via `figma-tokens` plugin.
- **Development sync:** Daily standup review of design open questions; asynchronous Loom walkthroughs for each major screen.
- **QA gates:** Accessibility audit (TalkBack, large text), dark/light theme parity check, offline scenario test cases, analytics event validation.

## Dependencies & Risks
- Requires updated icon and illustration library (tracked in `Screens_update_images_and _vectors.md`).
- Dependent on backend endpoints for Launchpad metrics and volunteering hours; dummy data contract defined in `Dummy_Data_Requirements.md`.
- Risk: performance overhead from layered gradients; mitigation via precomposed PNG backgrounds for low-end Android (< API 26).

## Success Criteria
- All primary flows meet <400ms interactive response time on mid-tier Android (Pixel 4a) with offline caching fallback.
- User testing (n=12) indicates ≥20% improvement in task completion speed for finding relevant opportunities.
- App Store/Play Store design consistency checklists satisfied, no WCAG AA regressions.
