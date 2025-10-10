# Blade Template Design Notes – Web Application Version 1.00

> Although the frontend uses React, the Blade design file outlines structural patterns for server-rendered previews (marketing pages on Laravel-powered admin).

## Template Structure
- **Layout File:** `resources/views/layouts/app.blade.php`
  - Includes `<header>`, `<main>`, `<footer>` partials aligning with React layout.
  - Inject CSS variables and Tailwind classes to match design tokens.
- **Components:** Create Blade components for hero, cards, CTA band to share markup with marketing automation stack.

## Hero Component (`resources/views/components/hero.blade.php`)
- Props: `eyebrow`, `headline`, `subheadline`, `primaryCta`, `secondaryCta`, `metrics` (array), `illustration` path.
- Layout replicates `HeroCanvas` with two columns and gradient background.

## Card Component (`components/card.blade.php`)
- Accepts `title`, `body`, `icon`, `ctaLabel`, `ctaUrl`.
- Renders structure with 24px padding, accent icon container.

## CTA Band (`components/cta-band.blade.php`)
- Wraps copy and button pair in gradient background with overlay orb.

## Styling Alignment
- Use Tailwind classes defined in `Css.md` to ensure server-rendered pages identical to SPA.
- Provide fallback `<style>` block for gradient backgrounds in case Tailwind not compiled (solid accent colour).

## Data Passing
- Use Laravel controllers to pass metrics and testimonials arrays from backend caches to Blade views.
- Ensure caching TTL matches React counterpart (10 min).

## Accessibility
- All Blade components include same aria attributes as SPA (e.g., `aria-live` on metrics updates if dynamic via Livewire).

## Responsive Behaviour
- Rely on Tailwind responsive classes for breakpoints. Validate on 320px, 768px, 1024px, 1440px.

## Testing
- Snapshot Blade output with Laravel Dusk to ensure parity with React design. Compare via Percy visual diff.
