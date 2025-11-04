# Screens Logic Flow Overview

## Navigation Shell
- **Primary Navigation:** Bottom tab bar (Home, Feed, Work, Discover, Profile) with contextual FAB.
- **Secondary Navigation:** Slide-in drawers (right for quick settings/saved searches, left for workspace switch where applicable).
- **Deep Links:** Push notifications and emails deep-link to specific screens, ensuring context (project ID, job ID) loads on entry.

## Core Journeys
1. **Talent Onboarding → First Application**
   - Welcome → Persona selection → Identity verification → Skills capture → Launchpad readiness → Home dashboard → Discover gigs → Job detail → Apply/Auto-assign modal → Confirmation.
2. **Client Project Creation → Escrow Management**
   - Home dashboard → FAB → Create project → Project details wizard → Escrow template selection → Team assignment → Project workspace → Escrow timeline.
3. **Agency Manager → Approve Milestone**
   - Notification centre → Milestone alert → Project workspace (Tasks tab) → Task detail → Approve milestone → Escrow release modal → Confirmation toast.
4. **Volunteer Discovery → Application**
   - Discover tab → Volunteer hub → Opportunity detail → Apply → Follow-up messaging via unified inbox.
5. **Support Escalation**
   - Any screen → Floating chat bubble → Support tab → Issue categorisation → Automated suggestions → Connect to agent → Transcript accessible in inbox.

## Error & Edge Cases
- **Offline Mode:** If connectivity drops, user stays within current screen; actions queue with status indicator. Reconnection triggers sync toast.
- **Session Expiry:** Re-authentication overlays on top of current screen; upon success, user returns to previous state.
- **Permission Changes:** If workspace roles updated server-side, next navigation event refreshes privileges and adjusts available tabs.

## Analytics & Telemetry Hooks
- Screen view events triggered on each unique screen load with persona, workspace, and feature flags.
- Conversion funnels instrumented for onboarding completion, project creation, gig applications, and feed posts.
