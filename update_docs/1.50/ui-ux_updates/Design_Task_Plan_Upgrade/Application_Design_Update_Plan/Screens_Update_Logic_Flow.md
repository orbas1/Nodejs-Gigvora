# Screens Logic Flow Updates — Application v1.50

## Overview
This document maps logic and decision flows for the major screen updates to ensure consistent behaviour across platforms. Each screen includes triggers, states, branching conditions, and success criteria for engineering implementation.

## Provider Dashboard Logic
1. **Entry Conditions**
   - User must have provider or admin role; role dictates modules shown.
   - System checks for incomplete onboarding; if true, displays onboarding banner.
2. **Data Fetching**
   - Requests metrics API (KPI, pipeline, alerts). If API fails, fallback to cached data with warning banner.
3. **Interaction Branches**
   - Clicking KPI tile opens detail modal with filter context preserved.
   - Selecting alert triggers drawer; if severity high, prompts confirmation before dismissal.
4. **Success States**
   - All modules loaded within SLA, alerts cleared or reassigned, quick actions executed.

## Queue Management Logic
- **Initial Load:** Fetch queue items with pagination; apply saved filters.
- **Selection:** Selecting row activates bulk action toolbar; if more than 20 selected, prompt to refine selection.
- **Assignment Flow:** Choose assignee → confirm availability → send notification; on failure, surface retry option and log error.
- **SLA Monitoring:** Items approaching deadline flagged; logic triggers escalation notification if threshold crossed.

## Consumer Gig Creation Flow
1. **Step Validation**
   - Each step has required fields; incomplete sections show inline errors and prevent progression.
   - Autosave triggered every 15 seconds and on step transition.
2. **Branching**
   - If user selects recurring gig, display schedule builder; else skip to attachments.
   - If budget below minimum, suggest recommended range and allow override with confirmation.
3. **Submission**
   - On final step, compile payload, check for policy acceptance, and send to API.
   - Success returns gig ID, transitions to confirmation screen, and triggers messaging channel creation.

## Messaging Thread Logic
- **Thread Load:** Retrieve conversation metadata, participants, last 50 messages; enable infinite scroll for history.
- **Composer States:** Determine allowed actions based on gig status (e.g., deposit requested). If attachments exceed size limit, surface error and suggest compression.
- **System Messages:** Display booking updates, payment reminders, or safety alerts inline based on backend events.
- **Read Receipts:** Update status when message displayed for ≥2 seconds in viewport; sync with backend.

## Settings Hub Logic
- **Navigation:** Tab selection updates URL hash for deep linking; maintain state on refresh.
- **Form Handling:** Each section uses optimistic UI with revert option; server errors show inline banner.
- **Verification:** If user toggles MFA, trigger verification flow with code input; success updates status chip.
- **Audit Logging:** All changes recorded with timestamp, user ID, and field diff.

## Error Handling & Edge Cases
- Network failures fallback to skeleton states and retry prompts.
- Permission mismatches show restricted state with request access CTA.
- For offline mobile usage, store actions locally and sync upon connectivity.

## Instrumentation
- Define analytics events for entry, exit, success, failure, and key interactions per screen.
- Track step durations, error counts, and cancellation reasons.
- Feed metrics into dashboards monitored weekly for anomalies.

## Testing Checklist
- Validate flow logic against acceptance criteria in staging environment.
- Simulate API failures, network latency, and permission restrictions.
- Verify analytics events firing with correct payloads.
- Conduct accessibility testing to ensure flow messages read correctly by screen readers.
