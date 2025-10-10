# Page Architecture Notes – Web Application v1.50

## Public Pages
- Home, Pricing (future), Resources library, Legal pages.
- Responsive hero templates share consistent grid and token usage.
- Use lazy loading for non-critical sections (testimonials, blog feed).

## Authenticated Pages
- Launchpad (default landing after sign-in) summarising onboarding and priority tasks.
- Dashboard surfaces cross-workspace metrics with quick filters.
- Workflows: Gigs, Projects, Ads, Volunteer, Integrations each have overview + detail templates.
- Settings and Profile accessible via global navigation with nested sidebar.

## Layout Shells
- Marketing shell: top nav, hero, stacked sections, static footer.
- Application shell: persistent header + collapsible sidebar, main content area with responsive grid, utility footer with contextual actions.

## Inter-app Alignment
- Shell patterns align with provider/user app to ensure muscle memory when switching devices.
- Shared tokens for spacing, colour, typography ensures parity with Flutter and admin surfaces.
