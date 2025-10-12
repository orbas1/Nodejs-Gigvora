# Version 1.00 Design Plan

## Vision
Deliver a cohesive, themeable Gigvora experience that makes talent discovery, booking, and programme management intuitive across mobile apps, responsive web, and provider dashboards. The plan merges insights from the Application Design Update Plan and Web Application Design Update libraries to ensure parity in navigation, component language, and compliance.

## Strategic Pillars
1. **Theme-ready system**: Provide seasonal “emo” themes (Creator Pulse, Studio Noir) alongside the Gigvora Blue baseline using a single token source of truth.
2. **Composable experiences**: Deconstruct pages into reusable partials (hero, testimonial, catalogue, CTA stacks, data widgets) to accelerate future campaigns and page launches.
3. **Guided journeys**: Surface contextual actions and progress cues that reduce user drop-off across discovery, booking, onboarding, and support workflows.
4. **Trust by design**: Embed compliance, accessibility, privacy, and transparency requirements into each component and template.
5. **Cross-platform parity**: Align navigation, IA, and micro-interactions between Flutter apps, React web, and provider tools to simplify learning and analytics.

## Experience Blueprint
### Mobile Applications (Flutter)
- **Navigation Shell**: Persistent bottom navigation with Discovery, Bookings, Messages, Wallet, Profile, plus adaptive floating action targeting “Book talent”, “Share portfolio”, or “Publish request”.
- **Discovery Feed**: Modular hero carousel, segmented feed (For You / Trending / Near You), and card-based community spotlights with theme overlays.
- **Booking Workflow**: Four-step stepper (Package → Customise → Schedule → Confirm) with sticky pricing summary, inline validation, and compliance copy tied to product area.
- **Auto-Assign Queue**: Dedicated queue module exposing assignment countdowns, score breakdowns (skills, availability, launchpad), and preference toggles wired to the backend auto-assign service. Offline support mirrors chat/feed behaviour with deterministic retries and history reconciliation.
- **Experience Launchpad & Volunteers**: Dedicated dashboards surfaced through discovery filters with new cards highlighting readiness status, required actions, and CTA to book or join. Volunteers Hub now layers invitation queue, commitment timeline, safeguarding checklist, and hour submission widgets with inline compliance copy (waiver, safeguarding prompts) and analytics hooks for impact logging parity with backend payloads.
- **Messages & Support**: Consolidated inbox with status pills, quick actions, and support escalation entry points; floating chat bubble anchors messaging access across app and web, maintaining unread counts and priority badges even when minimised. Chat composer includes templates, attachments, and theme-aware stickers, plus offline send queues, deterministic retries, and accessibility-compliant overlays for long sessions. Support timelines surface escalation metadata (priority badges, SLA timers, assigned agent chips) mapped directly to backend controller payloads and analytics events to keep UI and service contracts aligned.
- **Ads & Monetisation**: Dedicated tab with campaign list, pacing meters, and multi-step composer covering targeting, creatives, budget, and scheduling; includes offline draft autosave and compliance banners for financial disclosures.
- **Profile & Reputation**: Dynamic profile canvas combining headline, metrics, availability, programme affiliations, and experience timeline with design hooks for analytics, feature flags, and real-time status messaging shared with the live feed.

### Responsive Web Experience (React)
- **Engagement Feed**: Dialect-aware ranking, viewer state (reaction/share), moderation controls, and analytics tagging powering the refreshed feed across platforms; includes optimistic comment and share flows with accessibility copy.
- **Explorer & Search**: Interfaces now reference live Meilisearch indexes with freshness scoring, remote-role badges, geo map overlays, facet drawers, and saved-search alert modals so desktop and Flutter explorers share production-ready filters, notifications, and analytics hooks. Volunteer listings now expose commitment level chips, invitation status banners, and impact projections sourced from the new Volunteers Hub services.
- **Auto-Assign Experience**: Queue page, eligibility banners, and scorecard drawer consume the new Node.js service, surfacing countdown timers, decision controls, and participation toggles. Designs document analytics events, accessibility copy, and failure states (expired, reassigned, paused) for implementation parity across platforms.
 - **Profile Experience**: Editor drawer blueprint now captures headline, skills, availability, trust breakdown analytics, experience timeline, qualifications, portfolio evidence, and programme badges with inline validation and accessibility notes. Payload contracts mirror backend sanitisation—skills serialise to JSON strings, trust-score breakdown metadata powers the new insights module, and availability focus areas share the schema used by Experience Launchpad and Volunteer dashboards. The design spec now details the recalibrated 100-point trust weighting (foundation, social proof, Launchpad readiness, volunteer impact, jobs delivery, availability freshness, compliance) with chip labelling, tooltip copy, and analytics tags matching the backend service.
- **Project Management Workspace**: Dedicated project detail canvas layering metadata cards, fairness sliders, queue snapshots, and activity timelines so product, design, and engineering share a single blueprint for regenerative auto-assign governance.
- **Experience Launchpad**: Launchpad cohort page includes insight dashboards, readiness scoring badges, talent onboarding flows, employer brief forms, and analytics annotations covering placements, interviews, and opportunity mix for cross-team operations. The refreshed forms now embed compliance gates, consent messaging, SLA countdown chips, and telemetry hooks that match the new backend workflow so production UI mirrors the documented service contract.
- **Homepage**: 12-column fluid grid with hero, trust carousel, dynamic catalogue, and “Start a Request” CTA bars built from partials so marketing can mix hero, themed imagery, and testimonials per campaign.
- **Navigation**: Mega-menu featuring creator categories, Experience Launchpad, Volunteers, Agencies, and Monetisation; persistent search and account controls.
- **Booking & Checkout**: Single-page configurator with step indicators, sticky summary, inline error states, and compliance tooltips.
- **Knowledge & Support Pages**: New structured templates for FAQs, compliance disclosures, and help centre content using the same partial library.
- **Provider Dashboards**: Table, card, and chart patterns aligned with mobile experiences, including theme-safe density and iconography. Volunteer staffing board introduces allocation matrix (talent, mission, hours), safeguarding compliance alerts, and export controls that mirror the new backend reporting endpoints.
- **Trust Center**: Operations-grade dashboard presenting escrow KPIs, release queues, dispute workload, and evidence health messaging with accessibility-first typography and audit copy.

### Provider Tools (Web & Mobile)
- **Agency Dashboards**: Pipeline overview, financial health, and volunteer staffing views using new data visualisation tokens.
- **Company Dashboards**: ATS timeline, interview scheduler, and Launchpad readiness cards with contextual actions and theme-specific badges.
- **Settings & Administration**: Unified preference pages for theme selection, security controls, and compliance documents.

## Design System & Theming
- **Token Architecture**: Root tokens for colour, type scale, radius, elevation, opacity, and motion. Theme-specific tokens cascade to components and are exported to Flutter (JSON) and React (TypeScript). Theme switch toggles available to marketing for homepage/landing pages and to agencies for white-labelling.
- **Engineering Alignment**: Flutter monorepo now consumes the JSON exports through a dedicated design-system package and runtime loader, ensuring the Gigvora Blue baseline renders identically to the React implementation while enabling future seasonal themes.
- **CI Enforcement**: Golden test harnesses and integration smoke tests now run in GitHub Actions and Codemagic, protecting typography, spacing, and component states from regressions before beta releases.
- **Component Library**: Core components (buttons, cards, chips, tabs, tables, forms) refactored to reference design tokens and support state variants (default, hover, focus, pressed, disabled) plus theme overlays.
- **Imagery Guidelines**: Asset ratios (16:9 hero, 4:3 cards, 1:1 avatars), compression budgets (<250KB hero, <100KB cards), and thematic overlays accessible via design tokens.
- **Typography**: Inter family scale with Display, Title, Headline, Body, Label tokens; ensures WCAG AA at minimum.

## Content & Copy Strategy
- **Microcopy Playbooks**: Tone of voice guidelines (Professional, Energetic, Empathetic) with placeholders for dynamic data; includes compliance-provided disclaimers for escrow, biometric consent, privacy, ads targeting disclosures, and offline risk messaging.
- **Localisation**: Strings mapped to translation keys with length guardrails; partial templates include dynamic slots for left-to-right and right-to-left languages.
- **SEO & Schema**: Homepage and landing partials embed schema.org metadata, canonical tags, and open graph updates.

## Accessibility & Compliance
- WCAG AA 2.2 baseline across platforms, including keyboard focus states, ARIA mappings, accessible motion guidelines, and voiceover descriptions.
- FCA, GDPR, and PCI messaging integrated into booking, wallet, and account screens; consent flows recorded with audit trails.
- Security prompts (device registration, biometric unlock) designed with clear copy, fallback patterns, and theming support.

## Delivery & Governance
- **Design Review Cadence**: Twice-weekly triad reviews (Design, Product, Engineering) plus monthly compliance checkpoints.
- **Design QA**: Dedicated checklist covering token integrity, theme switching, accessibility, error states, and content accuracy before handing to development.
- **Documentation**: Design spec pages for each component, annotated Figma frames, and JSON exports for tokens and component metadata.
- **Rollout Plan**: Internal pilot (Week 6), beta release with theme toggles (Week 8), staged launch aligned with Milestone 4 readiness (Week 12), final GA with marketing campaigns (Week 14+), and post-launch monitoring for chat/feed queue health and ads pacing accuracy.

## Telemetry & Analytics Enablement
- Secure token and telemetry services in the Flutter foundation now stream mobile network, GraphQL, and realtime metrics into the analytics platform without manual tagging.
- Live operational dashboards can be designed against production data, allowing telemetry UI components to use real latency/failure distributions instead of placeholder copy.
- Support and compliance monitoring concepts will inherit this feed, ensuring colour, threshold, and alert semantics are validated against actual mobile behaviour.

## Dependencies & Risks
- CMS upgrades required for hero partial injection and dynamic testimonials (owned by Web Platform squad).
- Illustration backlog at 30% outstanding for Experience Launchpad and Volunteers; requires contract illustrators.
- Theme-switch testing depends on engineering delivering runtime toggles within React and Flutter before QA cycles.
- Accessibility audit slots secured for Week 9; delays will postpone compliance sign-off.
- Ads budgeting compliance requires final FCA sign-off on copy and review of wallet/ads shared components before GA.
