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

## Performance Considerations
- Optimise SVGs for minimal nodes; compress raster imagery to WebP where supported.
- Provide fallback PNGs for legacy contexts.
- Document usage guidelines per screen to avoid inconsistent application.
