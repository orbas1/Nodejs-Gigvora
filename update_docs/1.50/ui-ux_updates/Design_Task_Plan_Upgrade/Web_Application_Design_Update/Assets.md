# Asset Management Plan — Web Application v1.50

## Asset Types
- Photography (hero, testimonials, case studies)
- Illustrations (hero overlays, empty states)
- Icons (line icons, badges)
- Videos (hero background, customer stories)
- Logos (customer logos, certifications)

## Storage & Delivery
- Store master assets in Figma and export via DesignOps pipeline.
- Optimise images using WebP/AVIF with JPEG fallbacks.
- Host assets on CDN with caching headers and versioned filenames.
- Provide `srcset` for responsive images and `sizes` attribute for accuracy.

## Performance Targets
- Hero images ≤ 200KB compressed, WebP format.
- Customer logos ≤ 30KB each, SVG preferred.
- Video backgrounds compressed to ≤ 2.5MB, muted autoplay with fallback image.

## Governance
- Maintain asset inventory spreadsheet tracking usage, owner, last updated date.
- Ensure licensing compliance for photography and icon sets.
- Schedule quarterly audits to retire outdated imagery.

## Accessibility
- Supply alt text, captions, and transcripts for all assets.
- Provide still image fallback for animations when reduced motion enabled.

## Implementation Notes
- Document asset paths and naming conventions in development README.
- Provide placeholder assets for staging environments.
- Set up automated image optimisation in CI/CD pipeline.
