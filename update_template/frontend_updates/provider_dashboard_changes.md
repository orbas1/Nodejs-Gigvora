# Provider Dashboard Changes

## Goals
- Present actionable revenue, pipeline, and compliance insights in a single view.
- Reduce onboarding friction with progress cues and contextual help.
- Surface trust-building actions (credential renewal, review requests) prominently.

## Experience Updates
1. **Revenue Forecast Strip**
   - Combines historical earnings with AI-driven projections for the next quarter.
   - Allows filtering by agency team, service category, and marketplace region.
   - Export capability generates CSV with signed URL valid for 15 minutes.
2. **Lead Pipeline Board**
   - Kanban layout with drag-and-drop deals, integrated notifications when leads age beyond SLA.
   - Board columns configurable per provider role; respects RBAC to prevent cross-team data leakage.
3. **Compliance Checklist**
   - Dynamic tasks for credential renewals, contract updates, and policy acknowledgements.
   - Progress ring indicates percentage completion; overdue tasks trigger in-app nudges + email digests.
4. **Guided Onboarding Banner**
   - For partially onboarded providers, displays next best actions with integrated tooltips and video walkthroughs.

## Performance & Reliability
- Data fetching consolidated via GraphQL gateway with persisted queries; reduces initial payload by 40%.
- Implemented optimistic UI for pipeline interactions with rollback on conflict detection.
- Added error boundaries with friendly messaging and support escalation link.

## Accessibility & Localization
- All charts include textual summaries and aria-described relationships.
- Content fully translated to English and Spanish; copywriting validated for cultural nuance.
- Supports high-contrast and reduced motion settings inherited from global preference centre.
