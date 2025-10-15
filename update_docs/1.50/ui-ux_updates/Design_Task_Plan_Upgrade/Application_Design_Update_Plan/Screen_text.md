# Screen Copy & Text Guidelines — Application v1.50

## Tone & Voice
- Friendly, professional, and action-oriented.
- Use inclusive language that empowers providers and consumers.
- Avoid jargon; when unavoidable, provide tooltips or definitions.

## Copy Framework
1. **Headlines**
   - Communicate value quickly (e.g., "Stay ahead of every gig").
   - Limit to 8–10 words for clarity.
2. **Body Copy**
   - Provide concise instructions or context; use short sentences.
   - Highlight key information using bullet lists.
3. **Helper Text & Tooltips**
   - Offer guidance on complex fields or actions.
   - Use positive, supportive language ("Need an extra hand? Add a teammate.").
4. **System Messages**
   - Success: Celebrate and confirm ("Great! Your gig is live.").
   - Warning: Advise with clear next steps.
   - Error: Explain what happened and how to resolve.

## Content Patterns by Screen
- **Dashboards:** Emphasise insights and next actions ("Review 3 gigs waiting for assignment").
- **Queues:** Use status badges and inline notes to explain priorities ("Overdue by 2h — contact provider").
- **Gig Creation:** Provide friendly guidance for each section; highlight optional vs. required fields.
- **Messaging:** Keep system prompts short; use conversational tone for suggestions.
- **Settings:** Use descriptive labels and clarify impact of changes ("Updating payout details affects future transfers only").

## Accessibility Considerations
- Maintain reading level around grade 8–9 for broad comprehension.
- Ensure copy remains meaningful when translated; avoid idioms.
- Provide alt text and aria labels for icon buttons referencing action.

## Localisation Notes
- Support EN, ES, FR, PT. Provide context for translators (gendered nouns, placeholders).
- Avoid concatenating strings; use full sentences.
- Reserve space for longer translated text by allowing responsive layout adjustments.

## Review Process
- Copy reviewed by UX writer and legal/compliance for sensitive flows.
- Maintain copy deck mapping string IDs to usage contexts.
- Conduct usability testing including comprehension checks.

## Future Enhancements
- Implement personalised tips based on user behaviour.
- Integrate microcopy testing via feature flags to optimise conversion.

## Runtime Telemetry Copy
- **Prometheus Exporter Healthy:** "Exporter online — last scrape {{relativeTime}}"; keep tone neutral, no CTA.
- **Prometheus Exporter Warning:** "Exporter stale — last scrape {{relativeTime}}. Retry or open runbook." Provide runbook CTA label `View exporter runbook`.
- **Prometheus Exporter Error:** "Exporter unresponsive for {{failureMinutes}}. Follow incident steps to restore metrics." CTA `Open runtime runbook` and secondary text `Scrapes will resume automatically after resolution.`

### Governance Registry Copy (Added 23 Apr)
- **Summary Header:** "Data governance overview" with description "Track steward coverage, remediation backlog, and upcoming
  reviews across every bounded context."
- **Approved Chip:** "Approved" label with tooltip "Latest review passed {{reviewDate}} — next check {{nextReviewDate}}."
- **Monitoring Chip:** "Monitoring" label with tooltip "Follow-up scheduled {{nextReviewDate}} — monitor scorecard for
  updates."
- **Remediation Chip:** "Remediation required" label with tooltip "{{remediationCount}} outstanding tasks. Escalate to steward if
  overdue."
- **Empty State:** Title "No governance reviews yet" with body "Schedule your first data governance review to populate this
  dashboard." CTA `Plan review cadence`.
- **Healthy State:** Title "All domains compliant" with body "Keep momentum — next reviews due starting {{nextReviewDate}}."
- **Drawer Escalation Copy:** "Contact {{stewardName}} to unblock remediation. Include request ID {{requestId}} in your notes."
- **Mobile Snackbar:** Shorten to "Metrics exporter stale — last scrape {{relativeTime}}" with action `View telemetry` and optional secondary action `Runbook` when failure streak ≥ 3.
