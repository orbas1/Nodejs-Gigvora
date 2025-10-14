# Screen Size & Breakpoint Strategy — Web Application v1.50

## Breakpoints
- `xs` 320px — small phones
- `sm` 480px — large phones
- `md` 768px — tablets
- `lg` 1024px — small desktop
- `xl` 1280px — standard desktop
- `2xl` 1536px — large displays

## Layout Adjustments
- Hero text scales using clamp with min/max sizes per breakpoint.
- Value cards shift from 3 columns (desktop) to 2 (tablet) to 1 (mobile).
- Navigation transitions from full menu to hamburger at `lg` breakpoint.
- Pricing cards reduce to slider on `sm` to avoid overflow.
- Dashboard widgets stack vertically below `lg`.

## Testing Requirements
- Validate responsive behaviour across key browsers (Chrome, Safari, Firefox, Edge).
- Use responsive design mode to inspect breakpoints and confirm alignment.
- Run Lighthouse tests at different viewports to confirm performance budgets.

## Accessibility Considerations
- Ensure zoom up to 200% retains layout without horizontal scroll.
- Provide adequate touch targets at smaller breakpoints.
