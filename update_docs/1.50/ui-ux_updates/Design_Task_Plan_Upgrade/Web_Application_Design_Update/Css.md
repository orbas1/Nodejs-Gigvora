# CSS Implementation Guidelines — Web Application v1.50

## Architecture
- Use modular CSS architecture with utility classes from Tailwind + custom components for bespoke sections.
- Maintain global variables for colour, typography, spacing, and shadows.
- Separate marketing and logged-in styles using scoped namespaces to prevent conflicts.

## Key Practices
- Implement responsive design using CSS clamp, grid, and flexbox.
- Prefers `prefers-reduced-motion` media queries to disable non-essential animations.
- Use `aspect-ratio` for responsive media.
- Leverage `:where()` selectors to reduce specificity.

## Performance
- Inline critical CSS for above-the-fold hero content.
- Lazy-load non-critical CSS with `media="print" onload` technique when necessary.
- Use PurgeCSS to remove unused classes; ensure safelist for dynamic classes.

## Accessibility
- Define focus styles globally; ensure high contrast and consistent outlines.
- Provide print stylesheets for proposals and case studies.
- Ensure `:focus-visible` support with fallback for browsers lacking native support.

## Tooling
- Use PostCSS pipeline for autoprefixing, minification, and variable substitution.
- Maintain stylelint configuration enforcing naming conventions and best practices.

## Documentation
- Update Storybook with CSS usage examples and code snippets.
- Provide changelog for CSS updates tied to release version 1.50.
