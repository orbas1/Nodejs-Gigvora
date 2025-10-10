# Navigation & Menu Specification – Web Application v1.50

## Primary Sidebar
1. Home
2. Launchpad
3. Live Feed
4. Work (Gigs, Projects, Volunteer, Ads) – nested accordion
5. Insights
6. Resources
7. Admin (Settings, Billing, Compliance) – admin only

## Header Utilities
- Workspace switcher (dropdown with search)
- Omnibox search (Cmd/Ctrl + K shortcut)
- Notifications bell (opens side panel)
- Quick-create (button + dropdown)
- Profile menu (profile, settings, sign out)

## Contextual Menus
- **Gig list:** row-level kebab menu with actions (View, Edit, Duplicate, Archive).
- **Project board cards:** overflow menu for Assign, Add checklist, Move, Delete.
- **Insights charts:** menu for export as CSV/PDF, schedule report.

## Mobile Navigation
- Bottom dock with icons (Home, Work, Create, Notifications, Profile).
- Slide-out panel for full menu with sections grouped and search at top.

## Accessibility
- All menus keyboard navigable; use roving tabindex pattern.
- Provide audible feedback (aria-live) when menu items trigger asynchronous operations.
