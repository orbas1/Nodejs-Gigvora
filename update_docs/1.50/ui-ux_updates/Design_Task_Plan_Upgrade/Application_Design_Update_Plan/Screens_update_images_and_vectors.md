# Images & Vectors Plan — Application Screens

## Objectives
- Refresh imagery to reflect updated brand narrative and diversity of users.
- Optimise asset delivery for performance across web, mobile, and desktop.
- Provide consistent illustration styles supporting key workflows.

## Asset Categories
1. **Hero Illustrations**
   - Provider dashboard hero featuring collaborative team scenario.
   - Consumer app discover hero with community market scene.
2. **Empty States**
   - Queue empty, no messages, no gigs, completed onboarding, zero analytics data.
   - Each includes friendly character illustration and supportive copy.
3. **Onboarding & Education**
   - Step-by-step icons for identity verification, document upload, schedule setup.
4. **Support & Safety**
   - Icons for safety tips, trust center, help contact options.
   - Prometheus exporter pulse glyph, failure streak badge, and runbook CTA icon variants sized 32px/48px for admin dashboards and Flutter alerts.
5. **Governance & Compliance (Added 23 Apr)**
   - Governance summary badge set (approved, monitoring, remediation) for admin
     dashboards and Flutter cards.
   - Steward avatar overlays with compliance shield icon; retention policy
     illustration for healthy state and clipboard reminder for empty state.
   - Drawer header banner art combining data catalog motif with audit trail icon.
6. **Marketing Assets**
   - Testimonial imagery, industry-specific backgrounds, certification badges.

## Style Guidelines
- Use vector-based illustrations with clean geometric shapes, soft gradients, and subtle textures.
- Maintain consistent stroke width (2px) and rounded corners to align with iconography.
- Colour palette derived from brand tokens with complementary neutrals.
- Character design to highlight inclusivity (gender, ethnicity, abilities).

## Technical Specifications
- Export hero illustrations as SVG for web, Lottie for subtle animations.
- Provide PNG fallbacks for legacy browsers and offline experiences.
- Optimise for retina displays (2x/3x) on mobile with appropriate asset slicing.
- Implement lazy loading for non-critical imagery; prefetch critical assets.

## Asset Delivery Workflow
- Maintain Figma components with asset variants; use naming convention `Illustration/<Context>/<Variant>`.
- Export via DesignOps pipeline generating `@1x/@2x` assets and JSON metadata.
- Version assets with semantic tags (v1.50.0) for traceability.
- Host assets in CDN with cache-busting query parameters.

## Accessibility Considerations
- Provide descriptive alt text for all imagery; include context-specific copy.
- Avoid conveying essential information solely through illustration.
- Ensure animations include reduced motion variants or static alternatives.

## Performance Targets
- Keep hero illustration under 150KB gzipped, Lottie animations under 120KB.
- Aim for lazy-loaded assets to not exceed 10% of page load budget.
- Monitor Core Web Vitals to ensure LCP unaffected by imagery.

## Future Enhancements
- Develop seasonal illustration variants for campaigns.
- Explore 3D-lite illustrations for marketing while maintaining performance.
- Create interactive SVG states for analytics to highlight data points.
