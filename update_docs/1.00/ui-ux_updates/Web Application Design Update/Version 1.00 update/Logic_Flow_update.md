# Logic Flow Update – Web Application Version 1.00

## Overview
The logic flow consolidates marketing, discovery, collaboration, and account surfaces into a structured journey: orient → explore → engage → convert → retain. Each stage includes entry points, validation gates, and fallback behaviours documented for engineering and QA.

## Stage 1: Orient (Homepage)
1. User lands on `/`.
2. `HeaderShell` loads hero + metrics; `HeroCanvas` fetches live counts via `/api/metrics/home` with caching TTL 10 minutes.
3. CTA interactions route to `/register` or `/explorer` with query parameters capturing source (`hero_primary`, `hero_secondary`).
4. Scroll triggers `FeatureGrid` animations (stagger 120ms) and loads partner logos from CDN `assets/brands/web/v1/*.svg`.

## Stage 2: Explore (Explorer & Marketplace)
1. Search input focuses via `/` hotkey; typing triggers `useDebounce` 200ms before hitting `/api/search`.
2. Category chip toggles update `?category=` param; results grid re-fetches with `React Query`.
3. Filter drawer submissions update `filters` context; `DataStatus` component displays `loading → cached → live` states.
4. Empty state surfaces recommended actions (link to `Launchpad` or `Post opportunity`).

## Stage 3: Engage (Feed, Community & Messaging)
1. Feed requests `/api/feed` with page size 12 and caches via appCache (TTL 20s); viewer state merges reaction/share records by post to hydrate UI. IntersectionObserver prefetches next page at 75% viewport with rank score metadata for analytics.
2. Reaction palette (`like`, `celebrate`, `support`, `insightful`, `curious`) toggles optimistic state locally then calls `POST /api/feed/:id/reactions`; errors revert counts and raise inline toasts.
3. Comment drawer opens via `GET /api/feed/:id/comments`, lazy-loads replies, and uses inline composer posting to `POST /api/feed/:id/comments` with optimistic prepend and error recovery.
4. Share modal posts to `POST /api/feed/:id/share`, triggers analytics `web_feed_share_submit`, and updates viewer state to prevent duplicate share increments.
5. Floating chat bubble subscribes to `GET /api/messaging/threads`; selecting a thread fetches messages (`GET /api/messaging/threads/:id/messages`) while composer sends via `POST /api/messaging/threads/:id/messages`. Support CTA opens prefilled escalation modal hitting `/api/messaging/threads/:id/escalate`.

## Stage 4: Convert (Opportunities & Registration)
1. Opportunity details `/opportunities/:id` load hero summary, metrics, and apply form.
2. Apply CTA opens sliding panel with 3-step form (Profile confirmation, Proposal, Submission). Each step validated before proceeding.
3. Registration flows split by user type. Company registration includes compliance step requiring digital signature (DocuSign embed).
4. Upon completion, success screen encourages next action (post opportunity, explore launchpad).
5. Experience Launchpad page bootstraps via `GET /api/launchpad/dashboard` fetching pipeline metrics and pending briefs; `LaunchpadPlacementsInsights` maps payload into stat cards with WoW deltas while forms hydrate with user/company context.
6. Talent application submission posts to `/api/launchpad/applications` after validating readiness (profile completeness ≥80%, compliance docs attached). Success triggers toast, disables form, and invalidates dashboard cache. Errors anchor to sections with `aria-live` messaging.
7. Employer briefs submit to `/api/launchpad/employer-requests`, emitting CRM webhook events. UI adds new row to briefs table, sorts by SLA expiry, and triggers `launchpad.dashboard.refresh` analytics event.

## Stage 5: Retain (Dashboard & Profile)
1. Authenticated users redirected to `/dashboard` after login.
2. Dashboard fetches summary metrics, tasks queue, and notifications; modules collapsible with persisted state.
3. Profile completeness indicator calculates from filled sections; prompts to add missing info.
4. Settings entry ensures MFA toggles, notification preferences, and billing accessible within 2 clicks.
5. Launchpad insights refresh after applications or briefs complete; placements stat cards animate delta changes and highlight "Next action" CTA (schedule mentor interview, review brief) derived from backend recommendations.

## Stage 6: Monitor (Trust Center)
1. Finance/compliance operators navigate to `/trust-center` via global nav or deep link.
2. Page loads `GET /api/trust/overview` to hydrate escrow totals, dispute queues, release ageing buckets, and active accounts; data cached in `react-query` with 60s TTL.
3. Release queue action triggers `POST /api/trust/escrow/transactions/:id/release` with actor note; upon success, `fetchTrustOverview` invalidates cache and success banner appears.
4. Dispute cards display deadlines; evidence upload CTA routes to dispute detail (future iteration) or instructs ops to log via backend tool.
5. Cloudflare R2 status tile surfaces signed URL health; any fetch error downgrades status banner to amber with retry CTA.

## Error & Offline Handling
- Offline detection triggers banner; forms disable network actions but allow local draft save.
- API errors surface inline messages and log to `Sentry`. Retry mechanism uses exponential backoff (1s, 3s, 9s).
- 404 routes show illustration, search bar, CTA to return home.

## Analytics & Experiments
- Each stage logs `web.v1.stage.<name>.enter/exit` events.
- Experiment flags: `hero_layout_variant`, `feed_card_density`, `launchpad_highlight`. Document fallback experiences if flag missing.

## Dependencies
- React 18 + Vite/Tailwind stack.
- Libraries: `swiper.js` (testimonials), `recharts` (sparklines), `react-hook-form`, `zod`, `@heroicons/react`, `react-query`.
- Assets hosted via `Gigvora CDN` bucket `cdn.gigvora.com/web/v1/`.
