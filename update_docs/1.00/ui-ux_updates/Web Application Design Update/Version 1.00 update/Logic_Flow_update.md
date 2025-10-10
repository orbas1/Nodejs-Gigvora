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

## Stage 3: Engage (Feed & Community)
1. Feed uses `/api/feed` with infinite scroll (page size 12). IntersectionObserver loads next page at 80% viewport.
2. Post interactions: `Like` triggers optimistic update; failure reverts state and shows toast.
3. `Share update` CTA opens modal with composer (rich text, attachments). Autosave drafts every 20s.
4. Groups and Launchpad sections highlight community stats and `Join` CTAs, linking to detail routes.

## Stage 4: Convert (Opportunities & Registration)
1. Opportunity details `/opportunities/:id` load hero summary, metrics, and apply form.
2. Apply CTA opens sliding panel with 3-step form (Profile confirmation, Proposal, Submission). Each step validated before proceeding.
3. Registration flows split by user type. Company registration includes compliance step requiring digital signature (DocuSign embed).
4. Upon completion, success screen encourages next action (post opportunity, explore launchpad).

## Stage 5: Retain (Dashboard & Profile)
1. Authenticated users redirected to `/dashboard` after login.
2. Dashboard fetches summary metrics, tasks queue, and notifications; modules collapsible with persisted state.
3. Profile completeness indicator calculates from filled sections; prompts to add missing info.
4. Settings entry ensures MFA toggles, notification preferences, and billing accessible within 2 clicks.

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
