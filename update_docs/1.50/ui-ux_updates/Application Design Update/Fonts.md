# Font Strategy

## Primary Fonts
- **Manrope:** Heading hierarchy (H1–H6), numeric emphasis in dashboards.
- **Inter:** Body text, captions, helper text, and data tables.

## Usage Guidelines
- Maintain minimum 16px size for body copy; 14px permitted for dense data tables with increased line height.
- Headline scale: H1 32px, H2 28px, H3 24px, H4 20px, H5 18px, H6 16px on phone.
- Use 600 weight for headings, 500 for subheadings, 400 for body, 700 for emphasis.
- Apply letter spacing 0.5px for buttons and uppercase labels to improve readability.

## Accessibility
- Ensure text truncation only when necessary; provide tooltips for full content.
- Support dynamic type scaling up to 130% without layout breakage.

## Implementation Notes
- Provide Flutter `TextTheme` mapping with tokens referencing design system names.
- Export font files with appropriate licenses and ensure inclusion in asset bundle.
