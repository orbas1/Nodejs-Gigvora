# Project & Gig Management Dashboard Modules

## Overview
- Project launch workspace with budget, milestone, and collaborator scaffolding.
- Purchased gig tracking including compliance reminders and vendor scorecards.
- Bid desk, freelancer invitations, auto-match management, reviews, and escrow tooling.

## Backend endpoints
- `GET /users/:userId/project-gig-management`
- `POST /users/:userId/project-gig-management/projects`
- `PATCH /users/:userId/project-gig-management/projects/:projectId/workspace`
- `POST /users/:userId/project-gig-management/project-bids`
- `POST /users/:userId/project-gig-management/invitations`
- `PUT /users/:userId/project-gig-management/auto-match/settings`
- `POST /users/:userId/project-gig-management/auto-match/matches`
- `POST /users/:userId/project-gig-management/reviews`
- `POST /users/:userId/project-gig-management/escrow/transactions`

## Frontend modules
- `ProjectGigManagementContainer` powers the dedicated workspace tabs and creation dialogs rendered by `UserProjectManagementPage`.
- Panels: lifecycle, bids, invitations, auto-match, reviews, escrow.
- Hook `useProjectGigManagement` handles data loading and action wiring.

## Notes
- Open the workspace at `/dashboard/user/projects`; the user dashboard links directly via the Projects card.
- Requires `project-gig-management:manage` permission or owner access.
- Escrow balance adjustments follow debit/credit semantics when transactions complete.
- Auto-match settings accept comma separated lists for roles, skills, and geo preferences.
