# Screen Size Adaptations – Web Application v1.50

## Breakpoint Overview
- `xs <576px` (mobile portrait)
- `sm ≥576px` (mobile landscape / small tablet)
- `md ≥768px` (tablet portrait)
- `lg ≥992px` (tablet landscape / small desktop)
- `xl ≥1200px` (desktop)
- `xxl ≥1440px` (large desktop)

## Layout Adjustments
- **Navigation:** Sidebar collapses to icon rail at `md`, becomes top navigation at `sm`, bottom dock at `xs`.
- **Grid:** 4 columns at `xs`, 8 at `sm`, 12 at `md+`. Components define span tokens.
- **Cards:** Expand to full width at `xs`, 2 per row at `sm`, 3+ at `md+`.
- **Tables:** On `xs`, convert to stacked card format with key-value pairs; at `sm`, enable horizontal scroll.

## Typography Scaling
- Use CSS clamp to scale headings smoothly; ensure `body-1` never drops below 16px on desktop.
- CTA buttons maintain minimum 44px height on all breakpoints.

## Image Handling
- Serve responsive images via `srcset`; hero art has `sizes` attribute for viewport-based selection.
- Lazy-load non-critical images; prefetch next dashboard tab charts on idle.

## Interaction
- Hover-dependent interactions gain tap-friendly alternatives (e.g., overflow menu button visible by default on touch devices).
- Keyboard shortcuts adapt to hardware detection (display hints only on devices with physical keyboards).
