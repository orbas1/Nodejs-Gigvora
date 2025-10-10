# Web Application Design Update – Change Log

## Summary of Design Adjustments
- Replatformed homepage layout into modular sections with optional themed/seasonal hero regions and partial template injections.
- Reworked navigation to support mega-menu patterns, quick-create CTAs, and contextual account controls.
- Introduced responsive grid system with breakpoint-specific behaviour for cards, forms, and media.
- Standardised UI states, iconography, and motion specifications aligned with updated design system tokens.

## Detailed Change History
| Date       | Area                           | Previous State                                                                  | Updated State                                                                                                                      | Rationale                                                                                      |
|------------|--------------------------------|---------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| 2024-05-06 | Homepage hero                   | Static hero banner with single CTA.                                             | Dynamic hero modules supporting themes (festival, corporate, creator showcase) with layered imagery and multi-CTA support.         | Increase flexibility for marketing campaigns and improve conversion targeting.                 |
| 2024-05-06 | Navigation                      | Basic top nav with dropdowns lacking hierarchy.                                | Mega-menu with grouped categories, featured creators, and inline search plus persistent "Start a Request" CTA.                   | Reduce cognitive load and spotlight high-value paths.                                          |
| 2024-05-07 | Responsive grid                 | Fixed 12-column grid without adaptive gutters.                                  | Fluid grid with breakpoint-specific gutters, card spans, and stacked-to-inline transitions.                                        | Improve readability and maintain design integrity across devices.                              |
| 2024-05-08 | Booking configuration           | Multi-page form with inconsistent validation.                                   | Single scrollable configurator with sticky summary, inline validation, and progress tracker.                                       | Shorten completion time and reduce abandonment.                                                |
| 2024-05-08 | Trust & social proof sections   | Disparate testimonials lacking structure.                                      | Curated testimonials, ratings, and partner logos with consistent card treatments and carousel behaviour.                           | Reinforce brand credibility and highlight network strength.                                    |
| 2024-05-09 | Footer & secondary navigation   | Static footer lacking localisation and support links.                           | Global footer with localisation selector, support entry points, compliance links, and dynamic content slots.                       | Support regional rollouts and ensure legal compliance.                                         |
| 2024-05-09 | Accessibility enhancements      | Limited focus on keyboard navigation and ARIA labelling.                        | Full keyboard focus order, ARIA roles, skip links, and focus-visible treatments defined for all interactive components.            | Achieve WCAG AA compliance and improve usability for assistive technologies.                    |

## Dependencies & Follow-up
- Coordinate with CMS team to support partial template injection for hero and testimonial sections.
- Engage localisation vendor to populate new footer and navigation content.
- QA to validate responsive behaviour across supported browsers and viewports.
