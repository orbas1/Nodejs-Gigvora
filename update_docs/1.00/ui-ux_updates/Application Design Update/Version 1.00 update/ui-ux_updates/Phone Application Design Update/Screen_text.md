# Screen Copy Guidelines – Phone Application v1.00

## Tone & Voice
- Authoritative yet encouraging; emphasise professional growth and community impact.
- Sentences concise (max 120 characters for headlines, 80 for subheads) to maintain layout integrity.
- Use inclusive language and action verbs ("Discover", "Join", "Track").

## Core Copy Blocks
- **Feed Hero Headline:** "Your network is shaping the future of work." (Inter 26/32, semibold)
- **Feed Subcopy:** "Stay close to the roles, launchpads, and missions that match your ambition." (Inter 16/24, medium)
- **Offline Banner:** "You're offline. Viewing cached insights from <timestamp>." CTA: "Retry".
- **Explorer Placeholder:** "Search roles, gigs, projects, or people" (Inter 16/24, regular).
- **Marketplace Analytics Pill:** "<count> opportunities ready".
- **Opportunity Detail CTA:** `Primary`: "Apply now"/"Pitch idea"/"Join mission" depending on category. `Secondary`: "Share".
- **Launchpad Dashboard Title:** "Progress through your launch tracks".
- **Volunteering Dashboard Title:** "Make impact, track your hours".
- **Profile Stats Labels:** "Connections", "Launchpad badges", "Endorsements".
- **Settings Section Titles:** "Account security", "Preferences", "Notifications", "Support".
- **Support Hub Callout:** "Need more help? Our support team responds within 12 hours." CTA: "Contact support".
- **Login Headline:** "Welcome back to Gigvora". Subcopy: "Log in to continue building your opportunity pipeline.".
- **Register Headline:** "Create your Gigvora profile". Step hints: Step 1 "About you", Step 2 "Skills & interests", Step 3 "Security".
- **Company Register Copy:** "Set up your organisation space" with helper "We'll verify compliance before your first posting.".
- **Admin Login Alert:** "Admin access is monitored and logged." CTA: "Request OTP".
- **Error Overlay Copy:** Title: "Something went wrong". Body: "We logged the issue. Try again or contact support." CTA primary: "Try again", secondary: "Report issue".
- **Offline Overlay Copy:** Title: "Connectivity paused". Body: "We saved what we could. Reconnect to sync the latest opportunities." CTA primary: "Retry connection", secondary: "Work offline".
- **Welcome Tour Cards:**
  1. Title: "Stay on top of the feed". Body: "Personalised insights surface every morning." CTA: "Next".
  2. Title: "Explore new opportunities". Body: "Search across jobs, gigs, and launchpad tracks." CTA: "Next".
  3. Title: "Grow with launchpad". Body: "Track milestones and celebrate wins." CTA: "Personalise now".

## Microcopy
- **Forms:** Use inline hints such as "Use a work email when possible" (email field) and "8+ characters, 1 number" (password).
- **Error states:** Provide solution-oriented copy: "We couldn't refresh this list. Pull to try again or check support.".
- **Badges:** Example text `"Remote"`, `"Urgent"`, `"Hybrid"`, `"Paid"`.
- **Tooltips:** `Launchpad badges help track your growth.` `Queued messages will send automatically when you're back online.`

## Internationalisation Notes
- Reserve 20% additional width for translated strings.
- Provide translation keys in `arb` format (e.g., `feed.hero.headline`, `auth.login.subtitle`).
- Document pluralisation rules (e.g., `notifications.unread_count` handles zero/one/other) and use ICU message syntax for dynamic inserts like deadlines (`opportunity.deadline_in {days}`).
- Provide fallback copy for offline or limited connectivity states in languages without direct translation for "offline" (use "No internet" or localised equivalent confirmed by linguist).

## Content Governance
- UX writing team maintains termbase in Confluence; lock canonical terminology for features (Launchpad vs Accelerator) to avoid mismatched copy.
- Sensitive copy (data export, delete account) must be reviewed by legal; mark `@legal-review` comments in Figma and track sign-off dates.
- Microcopy changes require analytics annotation to measure impact on conversion; update `copy_change_log.csv` with string key, old value, new value, date, owner.
