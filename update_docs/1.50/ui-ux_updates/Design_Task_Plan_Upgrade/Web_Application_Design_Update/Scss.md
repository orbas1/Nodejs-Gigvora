# SCSS Structure — Web Application v1.50

## Folder Organisation
- `base/` — resets, typography, colour tokens.
- `layout/` — grid, spacing, section wrappers.
- `components/` — cards, buttons, forms, hero, navigation.
- `utilities/` — mixins, functions, helpers.
- `themes/` — light/dark and campaign overrides.

## Variables & Mixins
- Define `$color-*`, `$spacing-*`, `$font-*` variables aligned with design tokens.
- Mixins for responsive typography (`@include fluid-type()`), shadows, and gradient backgrounds.
- Function `theme-color($token, $mode)` to switch between light/dark values.

## Best Practices
- Use BEM-inspired naming for component classes.
- Keep component partials focused; avoid deep nesting (>3 levels).
- Leverage `@use`/`@forward` for modular imports.
- Document dependencies between partials.

## Build Process
- Compile SCSS via node-sass/dart-sass integrated into build pipeline.
- Generate source maps for debugging in development.
- Run stylelint-scss for linting prior to commit.

## Documentation
- Provide SCSS usage notes in design system referencing partials and mixins.
- Maintain README per folder outlining purpose and key files.
