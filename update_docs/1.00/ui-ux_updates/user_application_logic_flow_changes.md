# User Application Logic Flow Changes – Version 1.00

## Routing & Navigation
1. **Bootstrapping:** `main.dart` initialises offline cache, injects ProviderScope, and builds MaterialApp with shared theme and GoRouter config.
2. **Initial route:** GoRouter starts at `/feed`, exposing routes for login, register, company register, explorer, marketplace verticals, launchpad, volunteering, profile, and admin login.
3. **Navigation pattern:** Top-level destinations use direct routes; deep links (e.g., `/projects`, `/launchpad`) push full screens with consistent scaffolds.

## Authentication & Identity
1. **Login/Register screens:** Riverpod-managed forms capture credentials; on submit, requests sent via API client with error handling.
2. **Company register:** Extended flow collects organisation metadata before finalising account; triggers admin-specific dashboards post verification.
3. **Session handling:** Successful auth updates secure storage and analytics identity; subsequent routes check for presence of auth token before loading personalised data.

## Feed Lifecycle
1. **Data fetch:** Feed controller requests posts via repository, layering offline cache and GraphQL responses with REST fallback; skeleton placeholders render while loading.
2. **State handling:** Resource state tracks loading/error/fromCache/lastUpdated plus realtime metadata; UI shows offline, streaming, or error banners, enabling manual refresh.
3. **Composer & interactions:** Rich composer supports text, media, polls, and campaign attachments; optimistic publish pushes post locally with retry queue, rolling back if moderation rejects. Engagement actions (like, comment, share) trigger analytics events and optimistic UI updates with failure reconciliation.
4. **Live presence:** Feed view subscribes to the realtime gateway for new/updated posts with exponential backoff and resubscription; offline mode falls back to local change journal and surfaces sync toast once reconnected.

## Messaging Overlay & Chat Lifecycle
1. **Entry points:** Floating chat bubble persists across top-level routes, opening overlay with last active conversation; long-press opens inbox drawer.
2. **Offline queue:** Messages composed offline are staged with deterministic IDs, rendered immediately, and retried with exponential backoff until acked by server. Failed sends expose inline retry and escalation to email handoff.
3. **Read receipts & typing:** Overlay subscribes to presence socket to render typing indicators and receipts; when socket unavailable, client falls back to polling thread endpoints at reduced cadence.
4. **Attachment handling:** Media uploads leverage background isolate with progress events streamed to UI; cancellations retain draft metadata for future resend.

## Explorer & Search Flow
1. **Snapshot load:** On initial load, discovery snapshot API fetch populates categories; cached for 3 minutes for quick revisit.
2. **Querying:** Debounced input (400ms) triggers search endpoint; results mapped by category with fallback to snapshot when query empty.
3. **Analytics:** Each search result view records instrumentation for query, category, and result metadata to refine ranking.

## Marketplace (Jobs/Gigs/Projects/Launchpad/Volunteering)
1. **Shared controller:** `opportunityControllerProvider` is parameterised by category, enabling consistent fetch, cache, and analytics logic.
2. **Filtering & search:** Text input updates Riverpod state; controller fetches filtered results and updates UI in real time.
3. **Empty/error states:** Lists display category-specific copy; offline banners and retry actions appear when repository errors occur.
4. **CTA instrumentation:** Primary buttons call controller method to record engagement (apply, pitch, etc.) and optionally deep link to detail views.
5. **Detail screen:** When opening a listing, detail controller fetches extended metadata, tracks view analytics, and exposes actions (save, share, apply) with optimistic state updates.
6. **Bookmark & apply sync:** Saved opportunities persist to secure storage and sync with backend when online; offline toggles queue updates and surface progress pills. Apply/withdraw actions capture questionnaire responses, store them encrypted, and replay once network recovers.
7. **Auto-assign CTA:** Listings that participate in auto-assign surface a sticky card summarising the acceptance window, payout headline, and skills required. Tapping "Review assignment" deep links into the queue module with the relevant request pre-selected.

## Auto-Assign Queue & Preferences
1. **Queue screen:** New `AutoAssignQueueScreen` available from the navigation rail badge renders pending assignments using `PaginatedDataTable` with countdown chips and score highlights. The controller hydrates data from the `/api/auto-assign/queue` endpoint and reconciles optimistic updates when a decision is made offline.
2. **Decision flow:** Accept/Decline buttons trigger Riverpod actions that post to the backend and disable the card while awaiting acknowledgement. Accepting navigates directly to the opportunity detail screen; declining collapses the card with a reason selector (Misaligned skills, Unavailable, Rate). Requests marked expired move to the history tab and fire analytics events.
3. **Preference management:** Settings → Opportunities now contains toggles for opt-in/out, preferred opportunity types, launchpad track alignment, and weekly hour caps. Changes are debounced to avoid rapid network calls and persisted via the `/api/auto-assign/preferences` endpoint with offline queueing identical to other preference forms.
4. **Availability sync:** When a user switches their availability to "Unavailable" the queue module automatically pauses incoming assignments, sends a cancellation to the backend, and surfaces an inline toast describing when matching will resume.
5. **Notifications:** Push notifications link directly to queue entries; tapping the alert opens the queue screen with highlight animation. Background fetch jobs ensure countdown accuracy and trigger local reminders five minutes before expiry if the user has not responded.

## Launchpad & Volunteering Engagement
1. **Program discovery:** Launchpad list emphasises track metadata; CTA leads to program detail flow (webview or native) with registration steps.
2. **Volunteer missions:** Cards highlight organisation and location; CTA opens mission detail with ability to commit hours and sync to calendar.
3. **Progress tracking:** Launchpad detail stream listens for module completion events and updates badges plus reminders schedule.
4. **Calendar integration:** Volunteer commitments push to device calendar via permissioned API; cancellations update server and notify organisers.

## Profile & Community
1. **Profile screen:** Loads user data via GraphQL gateway with REST fallback, surfacing stats, availability, focus areas, groups, and activity timeline; allows editing and share actions.
2. **Connections & messaging:** Accept/decline invites update relationship state; messaging integration launches conversation threads.
3. **Badges & progress:** Launchpad badges and volunteer history aggregated to display personal growth metrics.
4. **Profile editing:** Multi-step form caches progress, validates sections, and only publishes once all mandatory fields satisfied.
5. **Portfolio uploads:** Media uploads leverage background isolate to stream bytes; progress indicators update UI while ensuring resumable transfers.

## Notifications & Offline Behaviour
1. **Notifications:** Polling/websocket events populate centre; tapping entry deep links to relevant screen and marks read.
2. **Offline mode:** Offline cache serves last synced data; banners inform user and disable destructive actions until reconnection.
3. **Error recovery:** Pull-to-refresh triggers forced repository refresh; persistent failures prompt support CTA.
4. **Session watchdog:** Token expiry triggers forced logout sequence with prompt to re-authenticate, preserving unsent drafts locally.
5. **Feature flags:** Dedicated service fetches remote toggles, merges with environment defaults, and notifies feature controllers; caching ensures safe fallback when flags change mid-session.

## Ads Campaign Flow
1. **Composer launch:** Ads tab exposes campaign list with budget pacing; tapping “Create Campaign” opens multi-step composer with targeting, creatives, budget, and scheduling.
2. **Draft handling:** Composer autosaves each step locally with schema versioning; offline submissions enqueue to ads repository and present status chips while syncing.
3. **Budget validation:** Client enforces currency, budget floor, and spend caps before enqueueing; failures surface inline errors referencing compliance copy.
4. **Reporting:** Ads dashboard hydrates from cached metrics, merging incremental deltas from analytics service; offline mode presents last known metrics with timestamp badge and disables status toggles until refreshed.
