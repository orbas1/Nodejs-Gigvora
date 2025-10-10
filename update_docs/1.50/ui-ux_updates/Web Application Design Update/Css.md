# CSS Architecture – Web Application v1.50

## Methodology
- Adopt **ITCSS** layering (Settings → Tools → Generic → Elements → Objects → Components → Utilities) to keep specificity manageable.
- Variables and tokens defined in `:root` (light theme) with future-ready `data-theme="dark"` override scaffolding.
- Use CSS custom properties for colour, spacing, typography to enable runtime theme switching.

## Naming Convention
- BEM-inspired names for complex components (e.g., `.card--metric`, `.nav__item--active`).
- Utility classes for spacing and layout follow `u-` prefix (e.g., `.u-mt-24`).
- State classes use `is-` prefix (e.g., `.is-loading`, `.is-collapsed`).

## Global Resets
- Use `modern-normalize` as baseline; additional adjustments for box-sizing and focus outlines.
- Set base font-size 16px; apply `font-smoothing` for crisp text on macOS.

## Performance Considerations
- Tree-shake unused styles via CSS Modules/per-page imports.
- Defer marketing-specific styles to route-level bundles to avoid bloating dashboard payloads.
- Use `content-visibility: auto` on long scroll containers to boost rendering.

## Accessibility Hooks
- Provide `.visually-hidden` utility for screen reader-only text.
- Focus states defined globally; ensure high contrast and thickness.
- Maintain `prefers-reduced-motion` and `prefers-contrast` media query support.
