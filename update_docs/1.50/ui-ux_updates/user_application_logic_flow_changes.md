# User App – Logic Flow Changes

## Onboarding & Identity
- **Persona Branching:** After selecting persona (Talent, Client, Hybrid), the flow conditionally surfaces relevant tutorials, default tabs, and data collection forms.
- **Compliance Gates:** Talent onboarding requires identity verification, skills tagging, and Launchpad eligibility checks before enabling job applications. Clients configure payment method and company profile before posting work.
- **Guided Tours:** Each major module (Live Feed, Project Workspace, Jobs Board, Ads) includes optional walkthrough triggered upon first entry.

## Home & Feed Logic
- **Smart Home Ranking:** Home screen widgets prioritise urgent tasks (pending milestones, expiring applications) followed by personalised recommendations.
- **Feed Algorithm:** Sort order combines recency, relationship strength, and engagement performance. Sponsored posts flagged with ads label; volunteer content boosted for Launchpad persona.
- **Notification Digest:** Aggregates unread counts from chat, approvals, payouts, and suggestions, linking to respective modules.

## Work Management
- **Project Lifecycle:** Workflow supports milestone approvals, task updates, document sharing, and direct chat. Escrow status changes trigger banners and require confirmation before acceptance.
- **Contest Participation:** Submission flow includes draft autosave, media validation, and countdown timer. After submission, status updates push to notifications.
- **Time Tracking:** Launchpad tasks optionally record time via in-app tracker; manual entry prompts compliance warnings if outside assigned hours.

## Discovery & Applications
- **Jobs & Gigs Filters:** Preference profiles (skills, rates, locations) inform default filter states. Saved searches can trigger push/email alerts.
- **Auto-Assign Handling:** When auto-assigned, talent receives modal with accept/decline actions and recommended next steps. Declines request reason to feed analytics.
- **Recommendations:** Launchpad readiness score influences gig/job suggestions, highlighting prerequisites when not yet eligible.
- **Application Review Visibility:** Candidates can track stage progression, see reviewer notes once shared, and receive system notifications when status updates trigger compliance or SLA thresholds.

## Communication & Support
- **Unified Inbox:** Conversations grouped by type. Opening a thread loads contextual actions (approve offer, open dispute). Support tickets escalate with SLA tags and transcript export options.
- **Chat Bubble:** Persistent bubble indicates unread count and can switch between support, project, and community channels.

## Profile & Reputation
- **Profile Completion:** Checklist updates in real time. Completing sections unlocks trust badge tiers with tooltips.
- **Analytics:** Engagement metrics update daily; if metrics drop, user receives tips via in-app messaging.

## Settings & Preferences
- **Notification Controls:** Users can configure delivery channel per category (push, email, in-app). Quiet hours supported.
- **Privacy:** Toggle for profile visibility (public, invite-only, hidden). Job seekers can mask employer details while still applying.
- **Analytics & History:** Notification preference changes log to activity history so users can audit digest, quiet hour, and escalation overrides.

## Error Recovery
- **Offline Drafts:** Posts, applications, and messages store locally until sync. Conflicts prompt merge dialog.
- **Session Resumption:** If app closes mid-action, user returns to saved step with confirmation toast.
