# Serviceman Dashboard Changes

## Objectives
- Equip servicemen with clear job priorities, SLA timers, and easy escalation paths.
- Maintain high performance on low-connectivity mobile devices.
- Provide supervisors visibility into field readiness without exposing sensitive data.

## Feature Highlights
1. **Mission Timeline**
   - Displays upcoming, active, and completed tasks with contextual colour coding.
   - Integrates with push notifications; acknowledgement syncs instantly through WebSocket channel.
2. **SLA Countdown Widgets**
   - Prominent timer per job with warning states at 15/5 minutes before breach.
   - Includes "Request Backup" button that triggers supervisor alert and attaches job context automatically.
3. **Offline Checklist**
   - SOPs cached locally with version tagging; diff viewer prompts update when newer SOPs released.
   - Allows check-offs offline, queues sync operations for next connectivity window.
4. **Escalation Drawer**
   - Quick access to chat, call, or incident report forms.
   - RBAC ensures only supervisors can see escalations across teams.

## Performance & Reliability
- Initial payload under 200KB via code splitting and asset compression.
- Implemented background sync worker with exponential backoff to avoid server flooding.
- Added Sentry breadcrumbs capturing connectivity changes, API retries, and push events.

## Accessibility & Safety
- High contrast theme enabled by default for in-field sunlight readability.
- Voice guidance toggle for hands-free navigation, using accessible ARIA live regions.
- Location sharing prompts include granular consent with "Share once" option.
