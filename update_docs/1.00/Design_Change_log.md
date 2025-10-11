# Version 1.00 Design Change Log

## Executive Summary
Version 1.00 introduces a coordinated redesign spanning the Gigvora mobile applications, responsive web experience, and provider dashboards. The refresh replaces the interim blue theme with a fully tokenised system that supports seasonal and partnership “emo” themes, restructures page templates to use composable partials, and formalises compliance, accessibility, and localisation guardrails. These changes were synthesised from the Application Design Update Plan and the Web Application Design Update artefacts and have been validated with product, engineering, compliance, and marketing stakeholders.

## Highlighted Shifts
- **Modular layout strategy** enabling hero, testimonial, and catalogue partials to be swapped per campaign without new deploys.
- **Dual-theme enablement** with base (Gigvora Blue) and expressive (Creator Pulse) palettes available across app, web, and provider tools via shared design tokens.
- **Navigation convergence** aligning mobile tab bars, provider sidebars, and desktop mega-navigation to a common information architecture.
- **Experience-specific dashboards** for Experience Launchpad, Volunteers hub, and monetisation suites using the new component grammar.
- **Expanded compliance surface** covering privacy states, financial disclosures, and accessibility instrumentation embedded in every template.

## Detailed Change History
| Date | Surface | Change Description | Prior State | Resulting Impact |
|------|---------|--------------------|-------------|------------------|
| 2024-05-20 | Design System | Introduced v3 design token library (colour, typography, elevation, motion, spacing) with light/dark and themed variants synced to Figma and code. | Fragmented colour styles and bespoke spacing definitions per team. | Accelerates implementation, unlocks theme switching, and reduces QA defects tied to inconsistent styling. |
| 2024-05-21 | Application Navigation | Consolidated mobile bottom navigation to Discovery, Bookings, Messages, Wallet, Profile and added adaptive floating action shortcuts. | Mixed navigation patterns between consumer and provider apps caused pathfinding confusion. | Improves task completion metrics and simplifies analytics attribution. |
| 2024-05-22 | Web Homepage | Rebuilt hero, social proof, and catalogue sections as configurable partials with theme-aware imagery slots, enabling campaign-specific homepages. | Static homepage with hard-coded layout and imagery. | Marketing can run simultaneous campaigns, improving conversion without engineering tickets. |
| 2024-05-22 | Provider Dashboards | Delivered new cards, tables, and status widgets for agencies/companies with consistent typography and spacing tokens. | Legacy dashboards with mismatched styling and limited density guidance. | Boosts data legibility and makes provider tools visually align with consumer experiences. |
| 2024-05-23 | Booking & Checkout | Redesigned booking flow stepper, inline validation, and compliance copy with responsive modals across app and web. | Multi-page flow with inconsistent messaging and error handling. | Reduces drop-off, improves compliance accuracy, and prepares for split-testing pricing layouts. |
| 2024-05-24 | Accessibility & Compliance | Added keyboard focus outlines, ARIA mappings, biometric consent copy, and localisation placeholders to master templates. | Accessibility tickets tracked separately with manual remediation. | Ensures WCAG AA alignment and audit readiness prior to QA hand-off. |
| 2024-05-24 | Imagery & Media | Established shared asset library with ratio guardrails, compression profiles, and theming overlays for hero and testimonial imagery. | Ad-hoc imagery sourcing without consistent art direction or performance budgets. | Improves visual quality, page speed, and storytelling consistency across platforms. |
| 2024-05-27 | Design System | Shipped Flutter-ready JSON token exports with runtime loader wiring Gigvora Blue theme into the mobile monorepo alongside DI-managed foundation package. | Tokens only referenced in design files with manual hand-off to engineering. | Accelerates implementation, guarantees parity with React tokens, and unlocks runtime theming without duplicate styling logic. |

## Open Change Requests
- **Theme marketplace** support (user-selectable community themes) pending brand leadership approval.
- **Dynamic testimonial ingestion** integration with CMS scheduled after analytics instrumentation stabilises.
- **Illustration backlog** requires additional artists to complete 30% of Experience Launchpad and Volunteer states.

## Approvals & Sign-offs
- **Product**: Reviewed by Head of Product on 2024-05-24.
- **Design Leadership**: Signed off by Principal Designer on 2024-05-24 with conditional follow-up on illustration backlog.
- **Compliance**: Privacy, FCA, and accessibility stakeholders approved updated copy and disclosure placements on 2024-05-23.
- **Engineering**: Frontend, Flutter, and provider platform leads acknowledged component constraints and implementation deadlines on 2024-05-24.
