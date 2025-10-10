# Screens Update – Version 1.50

## Overview
Version 1.50 expands the phone app to 62 core screens organised across onboarding, discovery, work management, communications, and settings. Each screen is mapped to component libraries and aligned to design tokens introduced in this release.

## Screen Groups
1. **Onboarding & Authentication (8 screens)**
   - Welcome, Persona selection, Identity verification, Skills collection, Company setup, Compliance consent, MFA setup, Tutorial overview.
2. **Home & Feed (10 screens)**
   - Home dashboard variants (Talent/Client/Agency), Live feed list, Post composer, Post preview, Post analytics, Notification centre, Saved items, Quick actions.
3. **Discovery & Search (7 screens)**
   - Global search, Filter panel, Saved searches, Recommendations hub, Volunteer hub, Launchpad discovery, Ads marketplace.
4. **Work Management (13 screens)**
   - Project list, Project detail tabs (Overview, Tasks, Files, Chat, Escrow), Contest workspace, Time tracking, Milestone approval, Deliverable review, Dispute timeline.
5. **Jobs & Gigs (7 screens)**
   - Job board, Gig list, Application detail, Auto-assign modal, Job creation (Client), Job analytics, Launchpad coach.
6. **Communication (6 screens)**
   - Unified inbox, Conversation detail, Threaded replies, Support ticket wizard, Video hand-off prompt, Chat settings.
7. **Profile & Reputation (6 screens)**
   - Profile overview, Edit sections, Trust score explainer, Portfolio manager, Testimonials, Analytics snapshot.
8. **Settings & Utilities (5 screens)**
   - Settings home, Notification preferences, Privacy controls, Payment methods, Legal & compliance centre.

## Key Additions
- **Floating Action Hub:** A modal overlay triggered from FAB that routes users to create posts, projects, jobs, or ads.
- **Escrow Timeline:** Integrated timeline showing escrow stages with CTA for release or dispute.
- **Launchpad Coach:** Guided progress interface with readiness score and checklist.
- **Volunteer Spotlight:** Dedicated screen to highlight volunteer opportunities with shareable cards.

## Deprecated Screens
- Legacy “Messages” and “Support” tabs replaced by unified inbox.
- Old “Wallet” screen replaced by Escrow + Payout overview integrated into project and settings sections.

## Dependencies
- Each screen references shared widget types defined in `Screens__Update_widget_types.md` and styling tokens in `Colours.md` and `Fonts.md`.
