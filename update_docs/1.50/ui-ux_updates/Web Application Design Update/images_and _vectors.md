# Image & Vector Asset Guidelines – Web Application v1.50

## Asset Types
- **Illustrations:** SVG-based scenes for hero, empty states, onboarding.
- **Icons:** 24px grid vector icons exported as SVG, with duotone option for accent.
- **Logos:** Partner logos in monochrome and full-colour variants.
- **Screenshots:** Product UI shots with blurred sensitive data, exported @2x PNG.

## Production Checklist
- Provide both light and dark-friendly variants for illustrations (future dark mode support).
- Optimise SVGs using SVGO; remove unused metadata.
- Maintain consistent padding (16px) around logos for cards.
- Use `loading="lazy"` and `decoding="async"` attributes for images.

## Storage & Naming
- Store assets in `/public/assets/v1_50/` with semantic names (`hero-organisation.svg`, `integration-slack.svg`).
- Keep version metadata in `Assets.md` for reference.
- Document usage rights for partner logos within `Resources.md`.
