# Images & Vector Requirements – Web Application Version 1.00

## Asset Inventory
| Name | Type | Source | Usage | Notes |
| --- | --- | --- | --- | --- |
| `remote-team-blue.svg` | Illustration | storyset.com "Remote Team" pack | Homepage hero | Apply accent overlay |
| `metrics-glow.png` | PNG | Custom Figma export | Behind metric badges | 360×360px, 40% opacity |
| `cta-orb.svg` | Vector | Custom | CTA band background | 780×780px |
| `partner-logos/*.svg` | SVG | Provided brand kit | Partner strip | Monochrome |
| `feed-preview.png` | PNG | Figma component | Hero card | 420×520px |
| `dashboard-sparkline.json` | Lottie | lottiefiles.com `analytics-growth` | Dashboard intro | 220×220px |
| `profile-dots.svg` | SVG | Custom pattern | Profile background | 1200×800px |
| `pricing-wave.svg` | SVG | Custom gradient wave | Pricing hero | 1440×640px |

## Export Guidelines
- Optimise SVG with SVGO (precision 3).
- PNG exports at 2× resolution for retina; use WebP fallback for hero imagery.
- Maintain naming convention `gigvora-web-v1-<asset>.ext`.

## Storage
- Store in `gigvora-frontend-reactjs/public/assets/web/v1/` with subfolders `illustrations`, `patterns`, `logos`, `vectors`, `lottie`.
- Update `Assets.md` with file paths and licences.

## Licensing & Attribution
- Storyset illustrations require attribution "Illustrations by Storyset" in footer (already included in Resources column).
- Pexels photography free for commercial use; include optional credit in alt text when applicable.
- Lottie asset under CC BY 4.0; include credit in docs.

## Performance Considerations
- Lazy load non-critical assets using `loading="lazy"`.
- Use `prefers-reduced-motion` to disable Lottie animation autoplay.

## Accessibility
- Provide descriptive alt text for informative images. Decorative vectors set `aria-hidden="true"`.
