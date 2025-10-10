# Dummy Data Requirements – Phone Application v1.00

## Purpose
Provide consistent mock data for design QA, prototype testing, and automated UI tests without relying on production services.

## Data Sets
1. **Feed Posts (`feed_posts.json`):**
   - Fields: `id`, `authorName`, `authorAvatar`, `timestamp`, `headline`, `body`, `tags[]`, `attachments[]`, `metrics` (likes, comments, shares), `type` (opportunity_update, launchpad_milestone, community_story).
   - Provide at least 15 entries, mix of long/short body text, include 3 with media attachments.
2. **Opportunities (`opportunities_<category>.json`):**
   - Categories: jobs, gigs, projects, launchpad, volunteering.
   - Fields: `id`, `title`, `organisation`, `location`, `compensation`, `workMode`, `deadline`, `tags[]`, `description`, `requirements[]`, `ctaLabel`, `heroImage`.
   - Supply 10 entries per category to stress test list length.
3. **Launchpad Progress (`launchpad_progress.json`):**
   - Fields: `programName`, `stage`, `completionPercent`, `milestones[]` (title, description, dueDate, status), `badgesEarned`.
4. **Volunteering Hours (`volunteer_hours.json`):**
   - Fields: `missionName`, `organisation`, `hoursCommitted`, `hoursCompleted`, `nextShift`, `location`, `contact`.
5. **Notifications (`notifications.json`):**
   - Fields: `id`, `category`, `title`, `body`, `timestamp`, `isRead`, `actionRoute`.
6. **Messages (`messages.json`):**
   - Conversations with `id`, `participant`, `messages[]` (sender, text, timestamp, attachments, status).

## Data Governance
- Use synthetic organisations and names; no real personal data.
- Timestamps should cover last 14 days to test relative time formatting.
- Provide translation keys for text to align with i18n strategy.

## Integration
- Store under `assets/mock_data/`. Update `pubspec.yaml` asset references.
- Provide stub repository implementations that consume JSON via `rootBundle.loadString` for offline demos.
- Create fixtures for automated widget tests (e.g., `FeedScreenTest` loads `feed_posts.json`).

## Analytics Simulation
- For prototypes, include `analytics` property on dummy records to simulate event logging (e.g., `expectedCTR`, `targetSegment`).
