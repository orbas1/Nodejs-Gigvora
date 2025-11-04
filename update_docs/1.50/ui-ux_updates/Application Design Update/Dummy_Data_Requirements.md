# Dummy Data Requirements

## Purpose
Provide realistic datasets for prototyping, testing, and demos covering new phone app features.

## Data Sets Needed
1. **User Profiles**
   - Talent, client, agency personas with varying trust scores, Launchpad status, volunteer interest.
   - Include profile completeness percentages, certifications, testimonials, and analytics metrics.
2. **Projects & Contests**
   - Active, pending approval, disputed, completed states with milestones, tasks, files, escrow amounts.
   - Contest entries with submission timestamps, scoring, and leaderboard positions.
3. **Jobs & Gigs**
   - Mix of gig postings, long-term jobs, volunteer roles, and auto-assigned opportunities.
   - Provide screening questions, application counts, saved status.
4. **Live Feed Content**
   - Text posts, image galleries, videos, polls, and sponsored ads.
   - Engagement metrics (likes, comments, shares) and moderation flags.
5. **Launchpad Coach Data**
   - Readiness scores, completed modules, recommended gigs, and pending assessments.
6. **Escrow & Financial Records**
   - Transactions with statuses (Funded, Pending Approval, Released, Disputed), amounts, due dates.
7. **Support Tickets & Chat Threads**
   - Conversations with tags, SLA timers, attachments, and escalation history.

## Format & Storage
- Provide JSON fixtures per module with references (user IDs, project IDs) to simulate real relationships.
- Store within `/fixtures/v1_50` for easy import into prototypes and automated tests.

## Update Cadence
- Refresh dummy data quarterly or when major schema changes occur.
- Keep dataset anonymised and synthetic to avoid privacy concerns.
