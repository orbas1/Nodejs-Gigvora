# Page Layout Guidelines – Web Application Version 1.00

## Shared Layout Shell
- `MainLayout` uses sticky header, gradient background, `max-w-7xl` container.
- Each page begins with `PageHeader` (eyebrow, title, description, optional actions).
- `Breadcrumb` optional for nested routes (projects, resources, settings sub-pages).

## Hero Bands
- Standard hero height 360px with background gradient variant `surface/softBlue` overlay.
- Hero includes icon or illustration (80px) for sub-pages (e.g., Launchpad). For dashboards, hero replaced with summary bar `height: 112px`.

## Content Blocks
- Use `Section` component with `padding-block: clamp(72px, 10vw, 96px)`.
- Provide `data-section-id` for instrumentation.
- Align to 12-column grid; ensure `gap: 32px` between sections.

## Sidebars
- For pages with side rails (feed, explorer, resources), allocate `grid-template-columns: minmax(0, 3fr) minmax(280px, 1fr)`.
- On ≤1024px, sidebars move below main content with `order: 2`.

## Tables & Lists
- Use card-based lists rather than dense tables. For metrics requiring tables, adopt `TableCard` with zebra striping `rgba(226,232,240,0.5)`.

## Sticky Elements
- Filter rows may sticky at top offset 88px to align with header height.
- Dashboard quick actions sticky within column `top: 120px`.

## Responsiveness
- Breakpoints defined in `Stylings.md`. At `sm`, convert multi-column to single stack.
- Use `overflow-x: auto` for horizontal metrics if columns exceed viewport.

## Motion
- Section entry: fade-up 20px with 200ms delay increments (AOS). Provide `prefers-reduced-motion` fallback to simple fade.

## Accessibility
- Landmarks: `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>` used consistently.
- Provide `aria-live` updates for dynamic sections (feed, dashboard notifications).

## Performance
- Code-split routes using dynamic import and suspense fallback skeletons.
- Preload critical CSS (header, hero, forms). Lazy load non-critical (testimonials, charts).
