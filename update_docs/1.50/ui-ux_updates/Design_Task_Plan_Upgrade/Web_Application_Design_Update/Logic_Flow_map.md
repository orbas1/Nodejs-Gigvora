# Logic Flow Map Summary — Web Application v1.50

## Flow Nodes
- **Start:** Visitor entry (organic, campaign, referral).
- **Decision A:** Known user? If yes, pre-fill forms and show personalised content.
- **Hero CTA:** Branch to demo form or trial modal.
- **Form Submission:** Success triggers confirmation page and CRM workflow; failure loops to error state with support options.
- **Resource Interaction:** Filters applied → results updated → resource detail or gated download.
- **Logged-In Navigation:** Dashboard → analytics → settings; maintain breadcrumbs and context parameters.

## Integrations
- Marketing automation (HubSpot) for form submissions.
- CRM (Salesforce) for lead assignment.
- Analytics (Segment, GA4) for event tracking.
- Payment gateway for plan upgrades.

## Error Recovery
- Provide manual contact link, chat option, and schedule call fallback.
- Auto-save partially completed forms with resume link emailed to user.

## Artefacts
- Detailed diagrams stored in Figma: `Web v1.50 > Flow Maps`.
- JSON event schema documented in analytics repository.
