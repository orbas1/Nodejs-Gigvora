# User App Wireframe Updates — Aurora Release

## Summary
User-facing mobile flows were aligned with the new Project Workspace hub. All wireframes now follow the Aurora design tokens, integrate contextual RBAC cues, and expose secure collaboration features without sacrificing performance.

## Updated Screens
1. **Workspace Overview (UA-WF-01)**
   - Added stacked summary cards for deliverables, budget, and risk alerts with swipe gestures for quick actions.
   - Embedded role-sensitive call-to-action chips ("Submit Work", "Approve", "Escalate") gated by RequireMembership service states.
   - Displayed live status pill for escrow with color-coded compliance badges.

2. **Task Board (UA-WF-02)**
   - Introduced horizontal swimlanes for assignment states (Backlog, In Progress, Review, Done) using accessible color palette.
   - Added progress heatmap overlay to highlight blocked tasks and impending SLA breaches.
   - Integrated quick comment drawer that mirrors desktop Markdown support.

3. **Meeting Scheduler (UA-WF-03)**
   - Unified scheduling experience with calendar stub service, enabling timezone-aware slot selection.
   - Provided fallback for offline scenarios with local caching and re-sync messaging.
   - Added call-to-action to join Agora meeting channel directly.

4. **Escrow Dispute Resolution (UA-WF-04)**
   - Simplified dispute submission to two steps: issue classification and evidence upload.
   - Introduced inline knowledge base card served from SupportDeskPanel for user guidance.
   - Added "Need live help" escalation button that triggers ChatwootWidget context.

5. **Verification Drawer (UA-WF-05)**
   - Surfaced verification tiers with checklists and progress indicator.
   - Provided timeline view of submitted documents with statuses fed by adminIdentityVerification service.

## Navigation Changes
- Replaced bottom-tab "Projects" icon with "Workspace" to communicate the consolidated experience.
- Added floating action button for "Add Deliverable" that adapts to screen context.
- Integrated quick access to support via persistent help icon anchored to right edge.

## Accessibility & Localization
- All wireframes adhere to minimum 44px tap targets and 4.5:1 contrast ratios.
- Strings include placeholders for localization keys, ensuring translation coverage for new tooltips and alerts.
- Right-to-left layouts verified for Task Board and Escrow flows.

## Hand-off Checklist
- Wireframe annotations exported to Zeplin with callouts for each interactive element.
- Component IDs mapped to React Native counterparts for development parity with Flutter implementation.
- Mobile QA scenarios derived from the updated wireframes documented in `update_tests/test_scripts/user_app_test_script.sh`.
