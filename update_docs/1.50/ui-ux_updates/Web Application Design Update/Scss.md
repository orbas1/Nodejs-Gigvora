# SCSS Implementation Notes – Web Application v1.50

## Folder Structure
```
styles/
  _tokens.scss         // colour, spacing, typography maps
  _mixins.scss         // media query, flex/grid helpers
  _functions.scss      // colour manipulation, clamp helpers
  base/
    _reset.scss
    _typography.scss
  layout/
    _grid.scss
    _header.scss
    _sidebar.scss
  components/
    _cards.scss
    _buttons.scss
    _forms.scss
    _tables.scss
  utilities/
    _spacing.scss
    _visibility.scss
  index.scss
```

## Tokens & Maps
- Use SCSS maps to store token scales, e.g., `$spacing-scale: (xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px);`
- Provide mixin `@include apply-token($property, $token-map, $key)` to reduce duplication.

## Mixins
- `@mixin respond($breakpoint)` using map of widths to keep media queries consistent.
- `@mixin focus-ring($color: var(--accent-300))` for standardised focus styling.
- `@mixin scrollbar()` for styled scrollbars on desktop with fallback.

## Theming
- Export light theme as CSS variables via `:root` block.
- Placeholder `data-theme="dark"` map prepared with inverted tokens for future release.

## Build Integration
- Use `@use`/`@forward` syntax for modular SCSS.
- Integrate with Vite/PostCSS pipeline; autoprefixer handles vendor prefixes.
- Enable CSS minification and purge based on React route-level chunking.
