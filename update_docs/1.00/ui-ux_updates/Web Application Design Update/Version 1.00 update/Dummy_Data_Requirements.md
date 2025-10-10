# Dummy Data Requirements – Web Application Version 1.00

## Data Sets Needed for Prototyping
1. **Opportunities**
   - Fields: `id`, `title`, `company`, `logo`, `category`, `type`, `location`, `budget`, `tags[]`, `description`, `postedAt`, `status`.
   - Provide at least 12 entries covering Jobs, Gigs, Projects, Volunteering.
2. **Feed Posts**
   - Fields: `id`, `author`, `avatar`, `timestamp`, `body`, `media`, `reactions`, `commentsCount`.
   - Include mix of text, image, link posts.
3. **Metrics**
   - Homepage: `verifiedTalent`, `activeProjects`, `matchTime`.
   - Dashboard: revenue, conversion, pipeline stats with trend data arrays for sparklines (12 points each).
4. **Testimonials**
   - `quote`, `name`, `role`, `company`, `avatar`.
5. **Launchpad Tracks**
   - `title`, `duration`, `cohortStart`, `mentors[]`, `description`.
6. **Resources**
   - `title`, `format`, `topic`, `excerpt`, `link`, `duration/pages`, `thumbnail`.
7. **Notifications & Tasks**
   - Task fields: `id`, `title`, `dueDate`, `status`, `link`.
   - Notifications: `id`, `type`, `message`, `timestamp`, `read`.

## Formatting Guidelines
- Use ISO 8601 dates.
- Budget values stored as integers (cents) with currency metadata.
- Provide localised strings for en-US (default) and en-GB variants.

## Storage & Access
- Store dummy JSON under `gigvora-frontend-reactjs/src/data/mock/web/v1/`.
- Provide index files exporting typed data for React components.

## Usage
- Use in Storybook stories, visual regression tests, and Figma prototypes.
- Document update cadence (refresh quarterly) in `Assets.md`.
