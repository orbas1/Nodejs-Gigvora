# Version 1.00 Design Update – Milestones

## Milestone 1: Foundation & Alignment (Weeks 1–2)
- **Objectives**: Validate research, align IA across app and web, and lock design system direction.
- **Key Deliverables**:
  - Experience maps for consumer, provider, Experience Launchpad, and Volunteers flows.
  - Approved navigation model covering mobile tab bar, desktop mega-menu, and provider sidebar.
  - Token architecture draft (colour, typography, spacing, elevation, motion) reviewed with engineering.
- **Success Criteria**:
  - Stakeholders sign off on vision and guardrails.
  - Tokens exported to experimentation builds in Flutter and React storybooks.

## Milestone 2: Systemisation & Theming (Weeks 3–5)
- **Objectives**: Industrialise the component library, implement theme variants, and prepare partial templates.
- **Key Deliverables**:
  - Component specs for buttons, forms, cards, tables, chips, banners, and hero modules with state annotations.
  - Emo theme exploration (Creator Pulse, Studio Noir) validated for accessibility and brand compliance.
  - Partial templates for homepage hero, testimonial carousel, catalogue grid, CTA stacks, compliance footers, and help centre pages.
- **Success Criteria**:
  - Tokens promoted to v3 release and imported into dev branches.
  - Theme switch demos approved by brand and marketing.
  - Flutter runtime loader verified in monorepo consuming JSON exports without manual overrides.

## Milestone 3: Experience Production (Weeks 6–9)
- **Objectives**: Apply the system to high-impact journeys across app and web, including new pages.
- **Key Deliverables**:
  - High-fidelity designs for discovery, booking, wallet, messaging, Launchpad, Volunteers, and monetisation dashboards.
  - Responsive web layouts for homepage, knowledge base, provider dashboards, and onboarding flows.
  - Illustration and imagery packages meeting new guidelines, including theme overlays and accessibility tags.
  - Telemetry dashboard data contract validated with live mobile analytics feeds powering network/GraphQL/realtime widgets.
- **Success Criteria**:
  - Development-ready specs with redlines, interaction notes, and copy ready for localisation.
  - Usability test findings show ≥15% improvement in task success vs. baseline prototypes.
- **Status Update**: Messaging overlay, support escalation timelines, live feed composer, marketplace offline states, and ads console specs are complete with annotated copy, motion, and accessibility notes; refreshed profile detail canvas, live feed streaming banners, and the Trust Center operations dashboard now match production build requirements with operations runbook alignment. Discovery explorer boards now include geo map overlays, facet drawers, and saved-search modals tied to live Meilisearch contracts for freshness scoring, remote-role badges, and synonym-driven chips. Wallet and volunteer imagery packages remain in progress.

## Milestone 4: Validation & Launch Readiness (Weeks 10–12)
- **Status Update**: Chat bubble overlays, feed moderation queues, and analytics tagging documentation are ready for QA sign-off; accessibility audits and wallet/volunteer imagery remain scheduled for the next sprint.
- **Objectives**: Complete QA, compliance, and rollout materials.
- **Key Deliverables**:
  - Accessibility audit report, remediation log, and signed compliance statements (FCA, GDPR, PCI).
  - Design QA checklist executed for all core journeys and component partials.
  - Golden baselines enforced through the shared CI/CD pipelines to catch regressions before release candidates.
  - Launch toolkit: release notes, component documentation, implementation guide, and marketing handoff package.
- **Success Criteria**:
  - Outstanding design debt <5% (measured by unresolved critical issues in Jira).
  - Final sign-off from Product, Engineering, Compliance, and Marketing for GA launch.
