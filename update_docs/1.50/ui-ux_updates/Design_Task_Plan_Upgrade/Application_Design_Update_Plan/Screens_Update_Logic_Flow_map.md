# Logic Flow Map — Application Screen Updates

## Diagram Overview
This mapping summarises start/end points, decision nodes, and key integrations for critical screens. Use in conjunction with detailed flow diagrams in the shared design repository.

## Flow Nodes & Connections
- **Start Node:** User authenticated or guest state verified.
- **Decision A:** Role check (Provider Admin, Provider Staff, Consumer). Determines accessible navigation routes.
- **Dashboard Path**
  - Fetch metrics → Render base modules → Decision B: Outstanding onboarding? If yes, display banner and restrict actions.
  - User selects module → Decision C: Requires additional permissions? If no, proceed to detail view; if yes, show request access modal.
- **Queue Path**
  - Load queue items → Decision D: Filters applied? If no, load defaults; if yes, apply saved preferences.
  - User selects items → Decision E: Bulk threshold exceeded? If yes, prompt refine selection; else show bulk action sheet.
  - Assignment → Decision F: Assignee available? If yes, confirm and notify; if no, suggest alternative.
- **Gig Creation Path**
  - Step 1 complete → Decision G: Recurring gig? Branch to schedule builder.
  - Step 2 attachments → Decision H: File size limit exceeded? Provide compression guidance.
  - Step 3 budget → Decision I: Below recommended range? Show prompt with override option.
  - Submission → Decision J: API success? If failure, display error with retry/back options.
- **Messaging Path**
  - Open thread → Decision K: Unread message count > 0? Mark as read and update badges.
  - Composer action → Decision L: Attachment type allowed? If unsupported, show error state.
  - Send message → Decision M: Connectivity available? If offline, queue message for send when online.
- **Settings Path**
  - Select tab → Decision N: Tab requires verification? If yes, trigger verification flow.
  - Update field → Decision O: Validation success? If not, highlight field with error message.
  - Save changes → Decision P: API success? If failure, revert optimistic update and show toast.

## Integration Touchpoints
- Analytics event logging at every decision node capturing user intent and outcomes.
- Notification service triggered on assignment success, gig submission, and verification updates.
- Audit logging for settings changes including before/after values.

## Error Recovery Mapping
- Each decision node includes fallback path directing user to safe state (e.g., cached data view, manual support links).
- Provide recovery CTA for persistent failures (reload, contact support, escalate).

## Artefact References
- Detailed flow charts stored in `Figma > Application v1.50 > Flow Maps`.
- Event taxonomy documented in `Analytics/Event-Catalog.md`.
- API contract updates tracked in `Engineering/API-Change-Log.md`.
