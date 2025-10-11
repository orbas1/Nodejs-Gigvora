# Application Design Update – Change Log

## Summary of Design Adjustments
- Adopted a modular home experience with themed hero cards to surface featured gigs, seasonal campaigns, and curated playlists.
- Refined navigation architecture by separating discovery, booking, and account management into persistent bottom-bar segments.
- Introduced dynamic theming tokens (light, dark, and high-contrast) that cascade across typography, iconography, and interactive elements.
- Standardised micro-interaction patterns for booking confirmations, chat replies, and gig status updates using platform-native motion curves.

## Detailed Change History
| Date       | Area                                | Previous State                                                                 | Updated State                                                                                                        | Rationale                                                                                   |
|------------|-------------------------------------|--------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------|
| 2024-05-07 | Home feed layout                    | Single static hero banner with mixed content density.                          | Rotating hero carousel with dedicated slots for campaigns, editorial picks, and location-aware quick actions.        | Improve engagement and allow merchandising space for business priorities.                  |
| 2024-05-07 | Navigation & information architecture| Collapsed menu with hidden booking management features.                        | Persistent bottom nav with Discovery, Bookings, Messages, Wallet, and Profile plus contextual floating action button.| Reduce cognitive load and make key flows one tap away for power users.                      |
| 2024-05-08 | Visual theming                      | Hard-coded brand colours and font sizes.                                       | Theme token system (colour, elevation, typography) consuming design variables exported to Flutter theme definitions. | Enable seasonal re-skins and accessibility variants without rebuilds.                       |
| 2024-05-08 | Interaction feedback                | Inconsistent loading indicators and toast notifications.                        | Unified motion spec with adaptive loaders, haptic patterns, and stacked toast notifications.                         | Reinforce trust by making status changes explicit and consistent.                           |
| 2024-05-09 | Booking workflow                    | Linear checkout pages without progress indication.                             | Segmented checkout with progress bar, editable summary card, and contextual support entry points.                    | Increase completion rates by clarifying required steps and offering recovery paths.         |
| 2024-05-09 | Creator portfolio cards             | Static card grid without performance metadata.                                 | Live cards showing rating delta, response time, and availability badge with support for inline actions.              | Help users make informed decisions quickly and promote high-performing creators.            |
| 2024-08-15 | Explorer search & badges            | Search prototypes relied on placeholder filters and manual curation.    | Search cards ingest Meilisearch freshness scores, remote/launchpad badges, and synonym-driven chips aligning with backend ranking. | Ensure discovery flows on mobile mirror production data behaviour and reduce implementation guesswork. |

## Dependencies & Follow-up
- Coordinate with backend team to expose engagement metrics APIs for hero card rules.
- QA to validate theming tokens across iOS and Android accessibility profiles.
- Analytics to set up experiment tracking for new navigation KPIs.
