# Component Functions – Web Application Version 1.00

## Structural
- **HeaderShell**
  - Handles route highlighting through `useLocation` active state, triggers mobile drawer open/close with aria-labelled button.
  - Integrates notification badge for logged-in users; badge updates via websocket events.
- **FooterMatrix**
  - Provides sitemap anchors, newsletter subscription form (inline email capture), and renders compliance badges.
- **HeroCanvas**
  - Delivers hero copy, metrics (animated counters triggered on scroll via `IntersectionObserver`), and CTA tracking events (`signup_hero_primary`, `signup_hero_secondary`).

## Interactive
- **CTAButton**
  - Accepts variants (primary, secondary, tertiary, destructive) to map to accent palette. Emits analytics event payload containing `componentId`, `targetRoute`.
  - Keyboard accessible with `Enter/Space` triggers, focus ring from design tokens.
- **ChipToggle**
  - Acts as segmented control for feed/explorer filters; supports multi-select when `selectMode="multi"`.
  - On selection, updates query params and instructs `useCachedResource` to refetch results with new filters.
- **MetricBadge**
  - Animates numeric values using requestAnimationFrame to count from cached baseline to live value.
  - On hover reveals tooltip summarising data source timeframe.
- **StatusBanner**
  - Displays contextual messaging (offline, cached, verification). Includes dismiss action writing to session storage for 24h suppression.

## Content
- **OpportunityCard**
  - Houses quick action buttons: `Apply`, `Save`, `Share`. Buttons map to respective API endpoints and open modals when necessary.
  - Supports skeleton state (grey bars) while loading; error state shows retry button.
- **TestimonialSlider**
  - Auto-rotates every 8 seconds with pause on hover/focus. Dots accessible for keyboard navigation.
- **TimelineSection**
  - Scroll-snap child aligning to top offset 120px to maintain context. Milestones highlight once `IntersectionObserver` registers 50% visibility.
- **DashboardMetricCard**
  - Fetches data via `GET /metrics/:type`; handles fallback to cached data with timestamp. Sparkline uses `recharts` area chart with gradient fill tokens.

## Informational
- **NavigationMenu**
  - Works with Next.js or React Router to maintain active classes. On mobile, transforms into accordion list with chevron icons.
- **ResourceList**
  - Each item includes filetype icon, download CTA, and required badge (e.g., `PDF`, `Slide`). On click, opens resource in new tab and logs event.
- **FAQAccordion**
  - Handles single or multiple open states. Contains `aria-expanded`, `aria-controls` for accessibility.
- **ProfileSummaryPanel**
  - Presents contact CTAs (Message, Invite, Share). On `Share`, opens modal to copy public profile link.

## Utility
- **SkeletonLoader**
  - Accepts `shape` prop to mimic target layout; automatically applies `prefers-reduced-motion` to disable shimmer.
- **FloatingSupportButton**
  - Expands into `SupportDrawer` with 3 shortcuts (Help Centre, Community, Contact). Maintains focus trap when open.
- **ToastNotification**
  - Stacks using portal anchored to `document.body`; auto-dismiss after 5s unless hovered.

## Data & Analytics Integration
- Components emit events via `useAnalytics` hook with naming conventions `web.v1.<component>.<action>`.
- Global theme tokens retrieved through `useThemeToken()` context ensuring consistent colours and radii.
- All interactive components rely on `focus-visible` polyfill to avoid double outlines.
