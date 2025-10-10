# Copy & Messaging Guidelines – Web Application Version 1.00

## Voice & Tone
- **Voice:** Confident, collaborative, future-forward. Avoid jargon; prioritise clear verbs ("Connect", "Launch", "Hire").
- **Tone Adjustments:**
  - Homepage hero: aspirational with action-focused CTA ("Join the talent exchange powering tomorrow's teams.").
  - Dashboard: informative, data-driven but supportive ("You're 2 steps away from completing your launchpad application.").
  - Error states: empathetic and solution oriented ("We couldn't load new opportunities. Refresh to try again or explore saved drafts.").

## Text Hierarchy
1. **Eyebrow Label:** 12px uppercase, describes category ("GIGVORA MARKETPLACE").
2. **Headline:** Primary message per section using `display-xl` or `heading-lg` tokens.
3. **Subheadline:** 18–20px supporting copy summarising value.
4. **Body Copy:** 16px descriptive paragraphs; limit to 90 characters per line.
5. **CTAs:** Imperative verbs, <5 words ("Start free trial", "Post opportunity").

## Content Templates
- **Hero Statement:**
  - Eyebrow: "GIG ECONOMY INTELLIGENCE"
  - Headline: "Build resilient teams with live talent intelligence"
  - Subheadline: "Discover vetted freelancers, unlock project-ready squads, and stay ahead with real-time insights."
  - Primary CTA: "Join the network"
  - Secondary CTA: "Browse live opportunities"
- **Opportunity Card Copy:** Title ≤60 characters, summary 2 sentences max, meta chips for category (`Gig`, `Remote`, `Paid`).
- **Testimonial:** Quote ≤200 characters, include role + company ("Product Lead, Nova Labs").

## Microcopy
- **Form helpers:** Provide actionable hints ("Use a work email for faster verification.").
- **Empty states:** Encourage action ("No saved gigs yet. Start exploring trending opportunities.").
- **Tooltips:** Limit to 80 characters; start with verb ("Track matches across every workspace.").
- **Toast messages:** Keep under 60 characters ("Launchpad application saved.").

## Accessibility & Localization
- Avoid idioms; prefer globally understood phrases ("Need help? Contact support").
- Provide placeholder text that complements labels, never replaces ("Search skills, titles, or keywords").
- All CTAs include `aria-label` to announce destination ("Join the network – opens registration form").

## Dynamic Content Rules
- Hero metrics show live counts ("6,240+ Verified freelancers"). Format numbers with locale-specific separators.
- Dashboard notifications reference days/hours ("Updated 4h ago"). Use relative time functions.
- Personalised feed uses first name only when profile completeness ≥40% to avoid blank greetings.

## Content Governance
- Store canonical copy strings in localisation JSON. Writers update via Contentful CMS; commit message includes reference ID.
- For legal copy, coordinate with compliance; highlight placeholders using `[[ ]]` in Figma and docs.
