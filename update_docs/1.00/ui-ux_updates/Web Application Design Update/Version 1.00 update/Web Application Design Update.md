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

## Version History Entry
This document forms part of the Version 1.00 blueprint and supplements the `design_change_log.md` summary with deep execution notes for the web application.
