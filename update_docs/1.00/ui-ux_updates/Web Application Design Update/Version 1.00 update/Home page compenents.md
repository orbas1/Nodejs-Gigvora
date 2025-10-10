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
- `TestimonialSlider` autop layer with `autoplay: { delay: 8000 }`, `keyboard: true`.

## Data Dependencies
- `metrics[]` from `/api/metrics/home`.
- `logos[]` from CDN config file `assets/brands/web/v1/partners.json`.
- `opportunity counts` aggregated from respective endpoints.
- `testimonials[]` stored in CMS; includes `quote`, `name`, `role`, `company`, `avatar`.

## Responsive Adjustments
- On mobile, metrics stack into two columns with 16px gap.
- `PartnerMarquee` slows speed to 50% on mobile for readability.
- `OpportunityHighlight` cards convert to slider (horizontal scroll) with 24px padding and `snap` behaviour.

## Performance
- Lazy load `TestimonialSlider` chunk using dynamic import to reduce initial bundle.
- Preload hero fonts via `<link rel="preload" as="font">`.
