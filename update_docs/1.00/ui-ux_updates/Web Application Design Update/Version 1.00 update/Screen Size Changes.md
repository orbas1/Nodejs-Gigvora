# Screen Size Adaptations – Web Application Version 1.00

## Breakpoint Summary
| Breakpoint | Width | Key Adaptations |
| --- | --- | --- |
| `xs` | 320–479px | Hero collapses to stacked layout, nav becomes hamburger, metrics grid 2 columns, CTA buttons full-width |
| `sm` | 480–767px | Partner carousel slows, feature cards two columns, filter drawer full screen |
| `md` | 768–1023px | Header shrinks to 64px, hero image scales to 340px, dashboard columns stack |
| `lg` | 1024–1279px | Sidebars appear, nav inline, partner logos align centre |
| `xl` | 1280–1535px | Hero maintains 2-column layout, metrics row 4 items |
| `2xl` | 1536–1919px | Content width capped 1280px; add background gradient bleed |
| `3xl` | ≥1920px | Increase hero padding to 160px, enlarge illustration to 600px |

## Navigation
- Mobile nav uses overlay with 100vh height, `padding: 24px`, `gap: 16px`.
- Tablet retains overlay but reduces width to 360px slide-out from right.

## Hero Section
- On mobile, metrics wrap to two columns with 16px gap; illustration hidden below 360px width to prioritise copy.
- On large screens, add additional radial orb `opacity: 0.3` to fill space.

## Cards & Grids
- Feature cards: 1 column at xs, 2 columns at sm, 3 columns at lg.
- Opportunity cards: 1 column at xs/sm, 2 columns at md, 3 columns at xl.
- Dashboard metrics: horizontal scroll at md (snap points), 3 columns at lg.

## Forms
- Multi-column forms collapse to single column at <1024px; progress indicator moves to top full-width bar.
- Input height remains 56px; reduce horizontal padding to 20px at xs.

## Imagery
- Partner logos shrink to 96px width at xs; hero illustration uses responsive `srcset` to serve 1x/2x.

## Motion
- At xs, disable parallax orb motion to reduce CPU usage.
- At md+, maintain 200ms transitions; reduce to 150ms at xs for snappier feel.

## Accessibility
- Ensure touch targets remain ≥44px at all breakpoints.
- Provide `prefers-reduced-motion` checks for animations.
