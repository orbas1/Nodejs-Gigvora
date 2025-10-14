# Component Types Inventory — Web Application v1.50

## Overview
Document primary UI components for the web marketing and logged-in experience to ensure reuse and consistent implementation.

## Component Categories
1. **Hero Modules**
   - Split hero, centered hero, checklist hero, video hero.
2. **Navigation Components**
   - Top navigation bar, mega-menu, sticky sub-navigation, breadcrumb trail.
3. **Content Modules**
   - Value pillar cards, testimonial carousel, case study grid, features list, statistics band.
4. **Conversion Elements**
   - CTA bars, lead capture forms, pricing cards, contact sales drawer.
5. **Support Modules**
   - FAQ accordion, resource tiles, blog card, event card.
6. **Footer Elements**
   - Multi-column footer, newsletter signup form, social icon set.
7. **Dashboard Widgets (Logged-in)**
   - KPI tiles, recent activity feed, tasks list, insights card, alert banner.

## Component Metadata
- Each component defined in design system with props, variants, responsive behaviours, and accessibility notes.
- Naming convention `Web/<Category>/<Component>`.
- Document dependencies (e.g., testimonial carousel relies on slider library with autoplay controls).

## Reuse Strategy
- Components built to be modular; allow marketing team to rearrange sections via CMS without breaking layout.
- Provide theming options (light/dark background) and content slots for copy/images.

## Accessibility Considerations
- Ensure keyboard navigation for carousels, accordions, and menus.
- Provide aria labels and roles for interactive components.
- Manage focus when modals/drawers open and close.

## Implementation Notes
- Components developed as React/Vue partials integrated with CMS.
- Use design tokens for spacing, colour, and typography to maintain consistency.
- Provide Storybook documentation with examples of each variant.
