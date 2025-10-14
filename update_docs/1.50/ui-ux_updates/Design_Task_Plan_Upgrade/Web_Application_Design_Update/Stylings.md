# Styling Guidelines — Web Application v1.50

## Overall Aesthetic
- Modern, professional tone with clean layouts, generous whitespace, and subtle depth.
- Balance between bold headlines and approachable imagery reflecting community impact.

## Key Styling Elements
- **Typography:** Space Grotesk + Inter with consistent hierarchy and responsive scaling.
- **Colour:** Indigo-led palette with accent orange; maintain high contrast and accessible combinations.
- **Imagery:** Use photography with gradient overlays, inclusive representation, and dynamic compositions.
- **Iconography:** 2px stroke outline icons with rounded corners; consistent sizing (24px/32px).
- **Shadows:** Soft, layered shadows (`0 20px 40px rgba(15,23,42,0.08)`), used sparingly to highlight interactive elements.
- **Borders:** Subtle 1px borders (`#E2E8F0`) to delineate sections when needed.

## Motion Principles
- Page transitions under 300ms with ease-in-out.
- Scroll-triggered animations minimal; use fade/slide to avoid distraction.
- Hover states include slight elevation and colour shifts for feedback.

## Responsive Styling
- Use fluid spacing tokens adjusting via clamp functions.
- Convert multi-column sections to stacked layout on narrow viewports.
- Maintain image ratios and cropping to prevent distortion.

## Accessibility Styling
- Focus outlines with 3px glow `rgba(67,56,202,0.6)` ensuring visibility.
- Provide high-contrast mode with simplified backgrounds.
- Ensure text scaling up to 200% retains layout integrity.

## Implementation
- Document styling tokens in design system; sync with CSS/SCSS variables.
- Provide sample templates for hero, content sections, CTA bars, forms, and footers.
- Include QA checklist verifying alignment with styling guidelines in staging builds.
