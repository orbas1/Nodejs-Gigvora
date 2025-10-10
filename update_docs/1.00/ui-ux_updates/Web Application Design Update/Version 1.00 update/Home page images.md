# Homepage Imagery & Illustration Plan – Web Application Version 1.00

## Hero Illustration
- **Asset:** `storyset/remote-team-blue.svg`
- **Dimensions:** 520×520px desktop, scales to 340×340px on tablet, 280×280px mobile.
- **Treatment:** Apply `mix-blend-mode: multiply` with accent overlay `rgba(37,99,235,0.12)`. Shadow `0 40px 120px -40px rgba(15,23,42,0.6)`.
- **Placement:** Right column of hero; anchored to baseline of CTA row with 48px offset.

## Live Feed Preview Card
- Snapshot of feed card using blurred background (Figma component `Web/Hero/FeedPreview`).
- Use placeholder avatar from [Pexels corporate pack] resized 56px and masked as circle.

## Partner Logos
- Source from `assets/brands/web/v1/` (monochrome SVG). Height 48px, width auto (max 140px). Provide grayscale to maintain consistency.

## Feature Icons
- Vector icons from [Phosphor Icons Bold]. Each exported as SVG 56×56px, tinted `#38BDF8` with 12% drop shadow.

## Metrics Backgrounds
- Create radial glow PNG `metrics-glow.png` (360×360px) stored under `assets/glows/`. Place behind metric badges at 40% opacity.

## Testimonials
- Avatars from [Pexels corporate pack] sized 56px. Apply `border: 4px solid rgba(255,255,255,0.24)`.
- Quote mark overlay `quote-mark.svg` sized 32px, tinted `rgba(255,255,255,0.32)`.

## CTA Band Background
- Use blurred abstract shape `cta-orb.svg` (two overlapping circles `#1D4ED8` and `#38BDF8`) scaled 780×780px, positioned absolute top-right, opacity 0.4.

## Accessibility
- All images include descriptive alt text ("Illustration of distributed team collaborating") except decorative backgrounds which use `aria-hidden="true"`.
- Provide `loading="lazy"` for images below fold.

## Performance
- Optimise SVG using SVGO; hero PNG fallback ≤240KB. Use `srcset` for 1x and 2x densities.

## Asset Management
- Store final assets in repo: `gigvora-frontend-reactjs/public/assets/web/v1/`. Document file names in `Assets.md` for easy retrieval.
