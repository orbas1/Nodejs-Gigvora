# Frontend Change Log — November 2024 Feature Pack

## Version 2024.11.0
### Added
- Role Control Center module with real-time RBAC diff visualisation and remediation wizard.
- Provider onboarding wizard supporting document capture, AI-assisted validation, and badge issuance preview.
- Serviceman Mission Control console with SLA countdowns, offline checklist caching, and escalation routing.
- Trust-Focused user profile layout with activity timeline, trust indicators, and personalised recommendations carousel.
- Global observability banner surfacing rate limit, CORS, and authentication anomalies across all dashboards.

### Changed
- Consolidated navigation across admin, provider, and serviceman portals to follow the new design token system.
- Rebuilt profile cards to use responsive grid and skeleton loading states for improved perceived performance.
- Updated typography scale and colour system to align with Accessibility 2.2 token ramp.
- Elevated security prompts to modal patterns with WebAuthn support for privileged actions.

### Fixed
- Eliminated duplicate API calls caused by legacy effect dependencies in the provider dashboard analytics widgets.
- Corrected timezone handling for serviceman SLA timers by leveraging server-issued ISO timestamps.
- Patched layout shift on user profile hero section when badges loaded asynchronously.
- Hardened storage client to prevent displaying stale signed URLs after credential revocation.

## Version 2024.11.1 (Hypercare Patch)
### Added
- Dedicated accessibility preference centre (reduced motion, high contrast, text spacing) persisted per profile.

### Fixed
- Addressed CORS preflight edge case for mobile web clients by aligning allowed headers with backend config service output.
- Resolved i18n fallback bug where Spanish locale defaulted to English for provider credential tooltips.
