# Widget Functions Reference

## Navigation Widgets
- **Bottom Tab Bar:** Switches between main sections while preserving state per tab. Displays notification dots for unread activity.
- **Floating Action Button Hub:** Presents contextual creation options; options adapt based on persona (e.g., client sees “Create Project”, talent sees “Create Post”).
- **Workspace Switcher Chip:** Allows agency/company users to toggle between workspaces; triggers state refresh and analytics event.

## Content & Cards
- **Feed Card:** Renders text, media, polls, and link previews. Supports inline like/comment/share actions and analytics overlay for creators.
- **Project Summary Card:** Shows status, next milestone, assigned team; includes quick action icons (chat, approve, view escrow).
- **Job Listing Card:** Displays key info (title, rate, type). Swipe actions allow save, share, or hide recommendations.

## Data Entry
- **Rich Text Composer:** Handles draft autosave, attachment management, mention suggestions, and preview before publishing.
- **Form Sections:** Stepper-aware forms validate inputs per step and surface inline hints; disabled until mandatory fields complete.
- **Media Uploaders:** Support multi-file selection with progress bars and retry options on failure.

## Feedback & Status
- **Escrow Timeline Component:** Visualises stages (Funded, In Progress, Pending Approval, Released, Disputed). Buttons adapt to current state.
- **Trust Score Dial:** Animates to show current score; tooltip reveals contributing factors and actions to improve.
- **Launchpad Checklist:** Tracks requirements completion with ability to open relevant screens.

## Support & Communication
- **Chat Thread Widget:** Supports threaded replies, quick actions (approve milestone, send files), AI suggestion chips, and transcript export.
- **Support Ticket Wizard:** Guides user through categorisation, attaches relevant context, and displays SLA expectations.

## Analytics & Insights
- **Metric Tiles:** Display aggregated counts with delta percentages and sparkline trend. Tapping opens detailed analytics.
- **Recommendation Carousel:** Horizontal scroller with cards; supports quick apply or follow buttons and logs interactions for ML feedback.
