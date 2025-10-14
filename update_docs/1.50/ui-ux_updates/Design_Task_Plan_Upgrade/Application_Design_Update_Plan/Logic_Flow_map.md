# Logic Flow Map Summary — Application v1.50

## Structure
- **Swimlanes:** User actions, UI components, backend services, integrations.
- **Nodes:** Start, decision, process, data, and end states annotated with numbering for cross-reference.
- **Legend:** Colour-coded states (success, warning, error) and iconography for automation triggers.

## Major Flow Highlights
1. **Provider Onboarding**
   - Nodes: Invitation received → Account creation → Verification branch (individual vs. agency) → Service selection → Activation.
   - Key Decisions: Document validity, compliance checks, optional training modules.
   - Integrations: Identity verification API, compliance service, messaging for onboarding notifications.
2. **Gig Intake & Assignment**
   - Nodes: Request ingestion → Qualification rules → Queue placement → Assignment decision → Confirmation.
   - Key Decisions: Provider eligibility, capacity, SLA compliance.
   - Automation: Auto-assignment suggestions, escalation triggers.
3. **Consumer Gig Creation**
   - Nodes: Initiation → Step 1 basics → Step 2 details → Step 3 preferences → Review → Publish.
   - Branches for recurring gigs, budget overrides, attachment validation.
4. **Messaging & Negotiation**
   - Nodes: Notification → Conversation view → Compose → Send → Status update.
   - Decision points for attachments, compliance filters, escalation keywords.
5. **Financial Reconciliation**
   - Nodes: Gig completion → Payout queue → Adjustment review → Transfer initiation → Receipt delivery.
   - Decisions for disputes, tax documentation, multi-currency handling.

## Visualisation Notes
- Flows use numbering scheme (F1-A, F1-B) to match documentation and acceptance criteria.
- Callouts indicate UI states (banner, modal, tooltip) and backend operations (API call, webhook).
- Conditional loops highlight re-entry points (e.g., document reupload, reschedule request).

## Data & Analytics Hooks
- Event tracking specified per node (start, completion, error).
- Time-on-step metrics captured to surface bottlenecks.
- Error taxonomy defined for reporting (validation, network, system).

## Artefact Access
- Master flow diagrams stored in Figma project `Application v1.50 > Flow Maps`.
- Exported PNG/SVG for documentation in shared drive `DesignOps/Flows/v1.50`.
- Annotated PDF for stakeholders requiring offline review.
