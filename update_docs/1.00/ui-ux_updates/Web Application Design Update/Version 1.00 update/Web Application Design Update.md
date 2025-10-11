# Web Application Design Update – Version 1.00

## Purpose
The Version 1.00 update introduces an enterprise-grade Gigvora web experience that mirrors the shared blue-forward design language while providing fine-grained documentation for engineering hand-off. This package covers component specifications, typography, colours, imagery sourcing, motion behaviour, responsive breakpoints, and content hierarchy for every major surface.

## Design System Pillars
- **Unified brand layers:** Gradient canvas built from `#0B1B3F` to `#1D4ED8` with accent spheres using `#38BDF8` blur, ensuring depth without sacrificing contrast.
- **Rounded geometry:** 24px base radius applied to cards, nav drawers, modal shells; 9999px for chips and pill buttons.
- **Typography cadence:** Inter family with weight ramp `400 → 700`, emphasising clarity and readability at 4K down to 320px, pairing with system fallbacks (`"Inter", "Segoe UI", sans-serif`).
- **Surface elevations:** 3 shadow tiers (`shadow-xs`, `shadow-sm`, `shadow-xl`) mapped to blur radii (12/20/32px) and y-offsets (4/10/24px).
- **Motion discipline:** 200ms ease-out for entrance/hover, 150ms ease-in for exit. Reduced motion preference disables parallax backgrounds and gradient drift.

## Documentation Index
| Area | File |
| --- | --- |
| Component inventory | `component_types.md` |
| Component behaviours | `component_functions.md` |
| Styling tokens & utilities | `Stylings.md`, `Css.md`, `Scss.md` |
| Colour tokens & gradients | `colours.md` |
| Typography, copy, voice | `Fonts.md`, `text.md.md` |
| Interactive elements | `buttons.md`, `Forms.md`, `Cards.md`, `Function Design.md` |
| Flow diagrams & logic | `Logic_Flow_update.md`, `Logic_Flow_map.md` |
| Page-level breakdowns | Files under **Pages Updates** |
| Data, navigation, and assets | Files under **Data & Nav Requirements** |

## Implementation Guidance
- **Design-to-code bridge:** Each component includes Tailwind utility tokens plus SCSS equivalents for teams preferring BEM modules. Developers should cross-reference `Css.md` for direct utility usage and `Scss.md` for theming architecture.
- **Asset pipeline:** Imagery sourced from [storyset.com](https://storyset.com) (for hero illustrations), [undraw.co](https://undraw.co) (for abstract technology scenes), and [Pexels curated corporate pack](https://www.pexels.com/collections/corporate-teamwork-8dq6s5n/) with attribution guidelines captured in `Assets.md`. Iconography references [Heroicons](https://heroicons.com) outline set.
- **Component library alignment:** Primary React components live under `gigvora-frontend-reactjs/src/components`. The specification aligns with folder names (`Hero`, `Header`, `OpportunityCard`, `TestimonialSlider`, `DashboardMetricCard`, etc.) to streamline adoption.
- **Testing & QA:** Snapshots should be regenerated to reflect new gradient tokens. Accessibility testing must cover 4 key flows: authentication, feed engagement, search filtering, and profile editing. All documented states include primary, hover, focus, disabled, error, and skeleton.

## Spatial Blueprint & Layering
- **Macro grid:** Marketing pages lock to a 12-column grid with `clamp(16px, 2vw, 40px)` gutters, while dashboards adopt an adaptive `grid-template-columns: repeat(auto-fit, minmax(320px, 1fr))` pattern to keep card widths between 320–420px. Hero sections break out to full bleed backgrounds but constrain content to `max-width: 1280px` for headline readability.
- **Elevation stack:** Surface hierarchy defined by layer tokens—`surface/base` (body background), `surface/elevated` (cards, modals), `surface/floating` (floating CTA with `z-index: 80`). Each layer pairs with an elevation shadow (`shadow-xs`, `shadow-sm`, `shadow-xl`) and blur intensities (6/12/20px) to visualise depth.
- **Gestalt cues:** Repeated use of overlapping 48px/64px circles and pill chips establishes continuity across hero metrics, testimonials, and dashboard widgets. Off-axis gradient orbs (20° rotation) act as anchor motifs and guide the eye diagonally through each screen.
- **Spacing cadence:** Section padding alternates 96px/72px blocks to avoid monotony. Micro-spacing tokens (12/16/24px) ensure consistent vertical rhythm inside cards and forms, while macro spacing (48/64/96px) signals transitions between narrative beats.

## Resource & Implementation Matrix
| Surface | Primary Components | Data Dependencies | Asset References | Engineering Notes |
| --- | --- | --- | --- | --- |
| Homepage hero | `HeroSection`, `MetricBadge`, `PartnerMarquee` | `/api/metrics/home`, CDN partner list | `remote-team-blue.svg`, `metrics-glow.png` | Implement metrics animation via `IntersectionObserver`; ensure hero metrics degrade gracefully without JS |
| Discovery / Explorer | `SearchBar`, `ChipToggle`, `FilterDrawer`, `OpportunityCard` | `/api/explorer/search`, cached filters, `useCachedResource` | `filter-icon.svg`, `opportunity-placeholder.png` | Drawer width 360px on desktop; convert to full-screen sheet on ≤768px |
| Dashboard | `DashboardMetricCard`, `TaskList`, `QuickActionDrawer` | `/api/dashboard/metrics`, websocket notifications | `dashboard-sparkline.json`, icon set from Heroicons | Use lazy data hydration (React Query suspense) to prevent layout shift; animate drawer entry with 220ms ease-out |
| Profile | `ProfileHeader`, `SkillTag`, `TimelineSection`, `ResourceList` | `/api/profile/:id`, `/api/profile/timeline` | `profile-dots.svg`, user avatar library | Provide fallback gradient avatar when photo missing; timeline uses scroll-snap alignment |
| Settings | `StatusCard`, `ToggleGroup`, `AuditLogTable` | `/api/settings/summary`, `/api/settings/activity` | `lock-icon.svg`, `globe-icon.svg` | Ensure toggles meet 44×44px touch minimum; audit table collapses to definition list on ≤640px |

## Motion & Responsiveness Checklist
- **Transition tokens:** Use `ease-out 200ms` for entrance (cards, modals), `ease-in 150ms` for exits. Hover states rely on GPU-friendly `transform` and `box-shadow` only—no costly layout recalculations.
- **Scroll choreography:** Hero gradient drifts at 0.25× scroll speed (disabled under `prefers-reduced-motion`). Testimonial sliders auto-advance every 8 seconds with pause on hover/focus and manual arrow controls pinned 40px outside card edges.
- **Breakpoint QA:** Validate 320px, 480px, 768px, 1024px, 1280px, 1536px, and 1920px. Confirm CTA pairs wrap without overflow, grid modules reflow to maintain 16px minimum margins, and typography clamps respect `min`/`max` to avoid orphan words on widescreen displays.

## Version History Entry
This document forms part of the Version 1.00 blueprint and supplements the `design_change_log.md` summary with deep execution notes for the web application.
