# Screen Logic Flow – Phone Application v1.00

## Feed Interaction Logic
1. App initialises offline cache → fetches fresh feed (GraphQL `feedSnapshot`).
2. Skeleton cards display until response; offline banner shows if cache served (`isFromCache == true`).
3. Filter chip taps update `FeedFilterState`; list animates via `AnimatedSwitcher` with 200ms fade/slide.
4. Scroll passes 60dp triggers shrink of hero header to compact app bar; FAB appears at scroll offset 280dp for "Post update".
5. Pull-to-refresh dispatches `refreshFeed()`; on success, top toast shows "Feed updated – <timestamp>".

## Explorer Search Flow
1. User taps search pill → overlay expands with `Hero` animation from pill to full-screen modal.
2. Query input debounced 400ms; if empty, show categories (Jobs/Gigs/Projects/Launchpad/Volunteering/People) with curated suggestions.
3. Search results grouped by category; selecting card pushes relevant detail screen using `GoRouter.pushNamed` with category-specific parameter.
4. Voice search triggers OS speech recognition; returned text populates field and triggers same debounced search.

## Marketplace Navigation
1. Bottom nav "Marketplace" entry loads hub with segmented tabs.
2. Each tab lazy-loads via `AutomaticKeepAliveClientMixin` to preserve scroll state.
3. Chips filter send parameter to `opportunityControllerProvider(category, filters)`; results respond with shimmer placeholders.
4. CTA engagement logs analytics event `opportunity_cta_tap` with category, id, userType.

## Opportunity Detail Flow
1. On load, hero image fetched (priority network) with placeholder gradient; summary card slides in from bottom (ease-out 180ms).
2. Accordions default collapsed; tapping expands with `AnimatedCrossFade`, updates analytics `section_open`.
3. Primary CTA triggers context-specific action (Apply, Pitch, Join). If user unauthenticated, route to login with return path.

## Launchpad & Volunteering Dashboards
1. Access requires membership flag; if absent, show teaser card with CTA to browse programs.
2. Dashboard cards data aggregated from `launchpadProgress` & `volunteerHours` endpoints; progress bars animate from 0 to value over 600ms on first appearance.
3. Timeline items support swipe actions (mark milestone done, log hours) with undo snackbars.

## Profile Experience
1. Collapsing toolbar transitions to pinned app bar at scroll offset 120dp; `SliverPersistentHeader` houses segmented controls (About, Experience, Portfolio, Activity).
2. Editing triggers modal bottom sheet forms; saving updates view with optimistic data update.
3. Share button opens OS share sheet with profile link and preview image generated via `share_profile` endpoint.

## Notifications & Inbox
1. Bell icon shows badge count; tapping opens modal sheet anchored at 88dp from top to keep glimpsed background.
2. Notifications grouped by day; "Mark all read" updates server and animates fade-out of badge.
3. Inbox segmented control toggles between `ListView` of conversations and requests; detail view uses `Navigator.push` to separate route.
4. Message composer disables send button when empty or offline; offline state offers "Queue message" storing to local DB.

## Authentication & Admin
1. Splash checks secure storage for token; if absent, direct to login card.
2. Login form validates on submit; errors show inline under fields with `Inter 12/16` red copy.
3. Register flow uses stepper with `AnimatedSwitcher` cross-fade between steps; progress indicator updates to match.
4. Admin login requires email + OTP; after request, timer countdown (60s) shown in accent text.

## Error & Offline Overlays
1. Global error handler pushes full-screen overlay route with severity-coded icon (error/warning/info).
2. Offline detection listens to connectivity stream; when offline, show persistent banner and optional offline screen triggered by manual refresh failure.
3. Actions triggered while offline stored in local queue; once connectivity restored, confirm with toast or escalate to error overlay if conflict occurs.
4. Error overlay provides `Contact support` button linking to support hub with prefilled diagnostic ID.
