# Web Application Logic Flow Changes – Task 3

The React application logic has been upgraded to align with the new dashboards, live services, and compliance workflows.

## Navigation & Role Awareness
- Added role-switching utilities (`resolvePrimaryNavigation`, `resolvePrimaryRoleKey`, `buildRoleOptions`) ensuring authenticated flows land on the correct dashboards before exposing timeline content or finance analytics.
- Replaced ad-hoc redirects with a deterministic router guard that checks RBAC claims, user verification state, and policy acknowledgements before entering protected routes; violations render contextual guidance instead of generic 403 errors.

## Compliance & Policy Gating
- Embedded policy acknowledgement gating into the main layout to capture legal consent prior to interacting with messaging, studio, and financial modules; acknowledgements persist via the policy audit service and surface expiration reminders when updated copy ships.
- Added contextual compliance banners on marketing pages (Refund Policy, Privacy, Terms) and auto-injected schema metadata for SEO/governance tracking.

## Support & Community Flows
- Introduced a support entry flow that loads the Chatwoot widget post-login, signs the contact with runtime-configured metadata, and routes conversations into the dashboard inbox for SLA-tracked escalation and moderation review.
- Added admin moderation flows that subscribe to realtime queue updates, support severity filtering, and capture resolution notes while dispatching actions back to the backend moderation service.

## Live Service Telemetry
- Layered in a live service telemetry polling flow that periodically retrieves backend snapshots, merges them with runtime health data, and displays incident guidance plus runbook links without blocking other dashboard interactions.
- Implemented exponential back-off and circuit breakers for telemetry polling to avoid cascading failures when backend services degrade.

## Security & Platform Integration
- Hardened the CORS/CSRF pipeline by aligning allowed origins with runtime environment configuration, tagging analytics headers, and rejecting wildcard origins outside approved partner domains.
- Extended session heartbeat monitoring with silent refresh for short-lived tokens, revoking navigation state when backend policies change (e.g., RBAC downgrade, account suspension).
- Enforced secure storage for sensitive feature flags and finance tokens by moving them into encrypted `SecureStorageService` wrappers and redacting values in diagnostics panes.

Collectively these logic flow changes ensure every Gigvora web experience is production-ready, policy-compliant, and resilient under real-world traffic, while keeping navigation intuitive for each persona.
