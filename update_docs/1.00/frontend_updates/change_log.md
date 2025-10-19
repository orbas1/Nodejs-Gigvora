# Task 3 Frontend Change Log

- Implemented the Gigvora design system tokens (`src/index.css`) with CSS variables for typography, colour, radius, spacing, and selection styling to anchor responsive behaviour across React and Flutter shells.
- Replaced the legacy header with an enterprise mega menu (`Header.jsx`, `MegaMenu.jsx`, `RoleSwitcher.jsx`, `navigation.js`) delivering role-aware routing, authenticated quick actions, and marketing journey links.
- Added a persistent policy acknowledgement banner (`PolicyAcknowledgementBanner.jsx`) to surface Terms/Privacy/Refund updates and store consent in localStorage per member ID.
- Promoted Creation Studio access with new header CTAs and ensured timeline-first navigation flows by default for authenticated members.
- Added `ChatwootWidget`/`useChatwoot` to MainLayout so authenticated members receive an SLA-aware support bubble that mirrors conversations into the dashboard inbox and respects runtime configuration toggles.
- Built an admin moderation dashboard (`AdminModerationDashboardPage.jsx` plus supporting components/services) delivering live queue metrics, actionable tables, audit timelines, and resolution workflows wired into the realtime moderation namespace.
- Extended the admin runtime overview with a `LiveServiceTelemetryPanel` that visualises chat throughput, inbox SLA posture, timeline cadence, event commitments, analytics freshness, and incident runbook shortcuts powered by the new backend API.
