# Blade Template Design Guidelines — Web Application v1.50

## Purpose
Provide structure for Laravel Blade templates powering marketing pages and logged-in layouts.

## Template Structure
- `layouts/app.blade.php` — base layout with header, footer, meta tags, analytics scripts.
- `layouts/dashboard.blade.php` — base for logged-in views with navigation and alerts.
- Partial templates for hero, CTA bar, testimonial slider, pricing cards, resource grid.

## Best Practices
- Use component slots for dynamic content; avoid duplicated markup.
- Keep logic minimal in templates; delegate to controllers/view models.
- Include accessibility attributes (aria labels, roles) in partials.

## Styling Integration
- Reference compiled CSS/JS bundles via mix helper.
- Pass design tokens (colours, spacing) via config to ensure parity with design system.

## Performance
- Cache partials where applicable; use `@includeWhen` for conditional sections.
- Lazy-load heavy components (video hero) using deferred scripts.

## Documentation
- Maintain README outlining template usage, partial naming conventions, and includes.
