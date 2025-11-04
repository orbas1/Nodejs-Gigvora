# Logic Flow Update

## Objectives
- Harmonise user journeys across personas while respecting compliance and financial safeguards.
- Support offline resilience and state restoration throughout critical flows.
- Embed analytics checkpoints for every conversion-critical step.

## Core Changes
1. **Persona-Aware Routing:** Navigation graph now branches immediately after onboarding to tailor tabs, tutorials, and notifications.
2. **Contextual Actions:** FAB and quick actions respond to current persona and screen context, reducing navigation overhead.
3. **Escrow Safeguards:** All financial actions require confirmation modals with compliance messaging; disputes block releases until resolved.
4. **Auto-Assign Handling:** Auto-assigned gigs/jobs surface modals with timers, recommended actions, and fallback contact options.
5. **Unified Inbox:** Consolidated messaging ensures any conversation can escalate to support or disputes while retaining history.
6. **Telemetry Integration:** Each step emits analytics events with persona, workspace, and funnel stage metadata.

## Edge Case Handling
- Offline queueing of actions with retry logic and user feedback.
- Session timeouts gracefully resume flows post re-authentication.
- Role changes trigger permission refresh without forcing logout.

## Dependencies
- Requires backend support for persona metadata, workspace switching, and escrow status updates.
- Relies on design token adoption to ensure consistent UI states.
