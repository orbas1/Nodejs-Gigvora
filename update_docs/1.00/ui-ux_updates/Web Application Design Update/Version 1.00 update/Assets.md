# Asset Register – Web Application Version 1.00

## Directory Structure
```
gigvora-frontend-reactjs/public/assets/web/v1/
  illustrations/
  patterns/
  logos/
  vectors/
  glows/
  lottie/
  photography/
```

## Key Assets & Metadata
| File | Category | Dimensions | Format | Source | Licence |
| --- | --- | --- | --- | --- | --- |
| `illustrations/remote-team-blue.svg` | Illustration | 520×520 | SVG | Storyset | Free with attribution |
| `patterns/profile-dots.svg` | Pattern | 1200×800 | SVG | Custom | Gigvora internal |
| `glows/metrics-glow.png` | Glow | 360×360 | PNG | Custom | Gigvora internal |
| `vectors/cta-orb.svg` | Vector | 780×780 | SVG | Custom | Gigvora internal |
| `vectors/pricing-wave.svg` | Vector | 1440×640 | SVG | Custom | Gigvora internal |
| `logos/partners/*.svg` | Logos | 140×48 | SVG | Partner kit | Usage per partner agreement |
| `photography/hero-team.webp` | Photo | 1600×1066 | WebP | Pexels (ID 3184325) | Free commercial |
| `lottie/dashboard-sparkline.json` | Motion | 220×220 | JSON | LottieFiles (analytics-growth) | CC BY 4.0 |

## Versioning & Updates
- Version 1.00 assets tagged `v1.00` in CDN.
- Maintain changelog in `design_change_log.md` referencing new assets.
- Use semantic naming `gigvora-web-v1-<description>.<ext>`.

## Optimisation
- Compress PNG/WebP with ImageOptim to ≤200KB.
- Remove unnecessary metadata from SVG.
- Provide `@2x` variants for raster assets where needed.

## Governance
- Asset approvals by Brand team; store approvals in Notion page `Brand/Asset Approvals` with link in this doc.
- When deprecating assets, update this register and archive files under `/archive/`.
