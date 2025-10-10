# Blade Template Design Notes – Web Application v1.50

Although the production stack is React, marketing pages support server-rendered Blade templates for rapid CMS iterations. Version 1.50 updates include:

## Layout Blocks
- `hero.blade.php`: accepts persona context, headline, subcopy, CTA labels, image asset path.
- `metric-strip.blade.php`: loops through stats array, auto-formats numbers with locale.
- `feature-grid.blade.php`: receives card content; uses CSS grid fallback for older browsers.
- `testimonial-carousel.blade.php`: integrates with JavaScript slider initialised via data attributes.
- `faq-accordion.blade.php`: accessible markup using `<button>` toggles and `aria-expanded` attributes.

## Partial Composition
- Use `@includeWhen` to load sections based on CMS toggles (e.g., show/hide volunteer block).
- Provide `@stack('scripts')` slot to inject page-specific JS (carousels, analytics).

## Theming Hooks
- Pass token values via config to ensure parity with React tokens.
- Support dark-mode toggle flag, though release is planned for later version.

## Performance
- Preload hero image using `<link rel="preload">` in head partial.
- Defer non-critical scripts to maintain sub-1.2s LCP on broadband.
