# Images & Vector Guidelines — Web Application v1.50

## Imagery Style
- Use high-resolution photography showcasing collaboration, professionalism, and diverse teams.
- Apply gradient overlays to maintain readability of text overlays.
- Maintain consistent colour grading (cool tones with warm highlights).

## Illustration Style
- Vector illustrations with geometric forms, soft shadows, and inclusive characters.
- Align stroke weight (2px) with iconography.
- Provide animated variants (Lottie) for hero sections and onboarding tours.

## File Specifications
- Export hero images at multiple resolutions (320px, 640px, 960px, 1440px) for responsive loading.
- Provide SVG for illustrations/icons with fallback PNG.
- Use compression tools (ImageOptim, SVGO) to minimise file size.

## Accessibility
- Include descriptive alt text describing scene/action; avoid decorative placeholders unless explicitly marked `role="presentation"`.
- Provide transcripts for vector animations with meaningful content.

## Implementation Workflow
- Manage assets via versioned library in Figma with naming `Img/<Context>/<Variant>`.
- Export via automated script generating `@1x/@2x/@3x` and WebP conversions.
- Review assets with marketing for brand alignment prior to release.
