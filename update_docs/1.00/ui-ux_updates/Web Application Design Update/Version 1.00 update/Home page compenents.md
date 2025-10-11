# Homepage Components – Web Application Version 1.00

## Component List & Mapping
| Section | Component | Props | Notes |
| --- | --- | --- | --- |
| Hero | `HeroSection` | `headline`, `subheadline`, `metrics[]`, `primaryCta`, `secondaryCta`, `illustration` | Accepts `align` variant for A/B test |
| Hero | `MetricBadge` | `value`, `label`, `delta` | Trigger count animation when visible |
| Partner Strip | `PartnerMarquee` | `logos[]`, `speed`, `backgroundVariant` | Auto-scroll with pause on hover |
| Feature Grid | `FeatureCard` | `icon`, `title`, `description`, `cta` | Use grid layout from `component_types.md` |
| Momentum Metrics | `DashboardMetricCard` | `value`, `label`, `sparklineData`, `trend` | Supports tooltip |
| Opportunities | `OpportunityHighlight` | `category`, `description`, `cta`, `link` | Each includes count badge |
| Launchpad | `LaunchpadHighlight` | `title`, `copy`, `cta`, `tracks[]` | Show top 3 tracks |
| Community | `CommunityPreview` | `groups[]` (name, members, tags) | Join CTA |
| Testimonials | `TestimonialSlider` | `testimonials[]`, `autoplay`, `interval` | Use `swiper.js` |
| CTA Band | `FinalCtaSection` | `headline`, `copy`, `primaryCta`, `secondaryCta` | Accepts background asset |

## Interaction Details
- `HeroSection` uses `IntersectionObserver` to trigger metrics animation at 50% viewport.
- `PartnerMarquee` duplicates logos for seamless loop; accessible pause button for screen reader users.
- `OpportunityHighlight` includes `aria-describedby` linking to supporting copy.
- `TestimonialSlider` auto-plays with `autoplay: { delay: 8000 }`, `keyboard: true`.

## Spatial & Layering Map
- Hero copy column spans grid columns 1–6; illustration floats over columns 8–12 with `z-index: -1` orb behind it (`opacity: 0.28`). CTA buttons sit on baseline 24px below body copy and align with metric badges baseline.
- Partner marquee sits on dark band `height: 120px` with logos vertically centred; top/bottom edges use `box-shadow: inset 0 1px 0 rgba(148,163,184,0.16)` to ease transitions between sections.
- Feature cards arranged on 12-column grid with `gap: 32px`; each card includes decorative 12px accent bar anchored to top-left corner to align across row.
- Final CTA band extends full width with background gradient; content constrained to 1040px centre column and uses mirrored button pair (primary left, secondary right) separated by 24px.

## Data Dependencies
- `metrics[]` from `/api/metrics/home`.
- `logos[]` from CDN config file `assets/brands/web/v1/partners.json`.
- `opportunity counts` aggregated from respective endpoints.
- `testimonials[]` stored in CMS; includes `quote`, `name`, `role`, `company`, `avatar`.

## Responsive Adjustments
- On mobile, metrics stack into two columns with 16px gap.
- `PartnerMarquee` slows speed to 50% on mobile for readability.
- `OpportunityHighlight` cards convert to slider (horizontal scroll) with 24px padding and `snap` behaviour.

## State Handling
- Hero CTA state toggles between `Join the network` and `Continue exploring` when user already authenticated; both share same width to avoid layout shift.
- Opportunity highlight slider exposes skeleton state of 3 grey cards while API warm loads; skeleton uses `animation: pulse 1.4s` for shimmer.
- CTA band accent orb intensifies on hover using CSS variable `--cta-glow-strength` so front-end can tie to user interactions without rewriting animation keyframes.

## Performance
- Lazy load `TestimonialSlider` chunk using dynamic import to reduce initial bundle.
- Preload hero fonts via `<link rel="preload" as="font">`.
