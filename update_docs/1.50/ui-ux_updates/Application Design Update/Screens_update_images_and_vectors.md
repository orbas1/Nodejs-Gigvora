# Images & Vectors Update

## Illustration System
- **Hero Illustrations:** Commission new vector scenes depicting cross-functional collaboration (talent + agencies + companies). Maintain blue gradient base with accent pops.
- **Empty States:** Create modular illustrations for feed, projects, jobs, Launchpad, and volunteer modules using simplified geometric shapes for faster load times.
- **Compliance Graphics:** Add iconography to explain escrow safeguards, dispute steps, and verification statuses.

## Photography
- Curate lifestyle imagery representing diverse talent working remotely; ensure releases for marketing surfaces.
- Provide masks and overlays to apply blue gradient filter for brand consistency.

## Icons
- Expand duotone icon set to cover Launchpad, Volunteer hub, Ads manager, Escrow, Disputes, and Analytics.
- Ensure 24px baseline grid and export as SVG for Flutter to convert to vector drawables.

## Asset Management
- Store assets in Cloudflare R2 with structured naming: `v1_50/<module>/<asset_name>.svg/png`.
- Include light/dark variants where necessary (e.g., logos, compliance seals).
- Maintain blueprint mapping sheet linking asset IDs to screen components:
  | Screen | Component ID | Asset | Notes |
  | --- | --- | --- | --- |
  | Onboarding – Persona Selection | `IMG-ONB-01` | `v1_50/onboarding/persona_collab.svg` | Optimised < 120KB, layered for parallax |
  | Launchpad Coach | `SCR-LP-01` | `v1_50/launchpad/coach_meter.svg` | Animated via Lottie, includes radial gradient |
  | Volunteer Spotlight | `VOL-01..03` | `v1_50/volunteer/spotlight_card_{n}.jpg` | Use teal overlay gradient via CSS blend |
  | Dispute Timeline | `BNR-DSP-01` | `v1_50/escrow/dispute_banner.svg` | Amber gradient background with icon sprites |
  | Analytics Drill-down | `CHT-01/02` | `v1_50/analytics/post_performance.json` | Vega-Lite spec for charts |

## Performance Considerations
- Optimise SVGs for minimal nodes; compress raster imagery to WebP where supported.
- Provide fallback PNGs for legacy contexts.
- Document usage guidelines per screen to avoid inconsistent application.
