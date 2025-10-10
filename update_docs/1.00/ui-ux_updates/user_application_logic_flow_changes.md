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
1. **Data fetch:** Feed controller requests posts via repository, layering offline cache; skeleton placeholders render while loading.
2. **State handling:** Resource state tracks loading/error/fromCache/lastUpdated; UI shows offline or error banners, enabling manual refresh.
3. **Interactions:** Engagement actions (like, comment, share) trigger analytics events and optimistic UI updates.

## Explorer & Search Flow
1. **Snapshot load:** On initial load, discovery snapshot API fetch populates categories; cached for 3 minutes for quick revisit.
2. **Querying:** Debounced input (400ms) triggers search endpoint; results mapped by category with fallback to snapshot when query empty.
3. **Analytics:** Each search result view records instrumentation for query, category, and result metadata to refine ranking.

## Marketplace (Jobs/Gigs/Projects/Launchpad/Volunteering)
1. **Shared controller:** `opportunityControllerProvider` is parameterised by category, enabling consistent fetch, cache, and analytics logic.
2. **Filtering & search:** Text input updates Riverpod state; controller fetches filtered results and updates UI in real time.
3. **Empty/error states:** Lists display category-specific copy; offline banners and retry actions appear when repository errors occur.
4. **CTA instrumentation:** Primary buttons call controller method to record engagement (apply, pitch, etc.) and optionally deep link to detail views.

## Launchpad & Volunteering Engagement
1. **Program discovery:** Launchpad list emphasises track metadata; CTA leads to program detail flow (webview or native) with registration steps.
2. **Volunteer missions:** Cards highlight organisation and location; CTA opens mission detail with ability to commit hours and sync to calendar.

## Profile & Community
1. **Profile screen:** Loads user data, including stats and activity timeline; allows editing and share actions.
2. **Connections & messaging:** Accept/decline invites update relationship state; messaging integration launches conversation threads.
3. **Badges & progress:** Launchpad badges and volunteer history aggregated to display personal growth metrics.

## Notifications & Offline Behaviour
1. **Notifications:** Polling/websocket events populate centre; tapping entry deep links to relevant screen and marks read.
2. **Offline mode:** Offline cache serves last synced data; banners inform user and disable destructive actions until reconnection.
3. **Error recovery:** Pull-to-refresh triggers forced repository refresh; persistent failures prompt support CTA.
