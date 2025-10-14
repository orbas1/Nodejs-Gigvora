# Web Card Components — Version 1.50

## Card Types
- Value pillar card
- Case study card
- Resource card (blog, whitepaper, webinar)
- Pricing feature card
- KPI dashboard card

## Anatomy
- Header with icon or image thumbnail.
- Title and supporting text.
- Metadata row (category, reading time, industry).
- CTA area (button/link) with consistent alignment.

## Visual Styling
- Border radius 18px, shadow `0 20px 40px rgba(15,23,42,0.08)`.
- Background options: light (`#FFFFFF`), tinted (`#EEF2FF`), dark overlay for hero carousel.
- Hover effect: subtle lift (translateY(-4px)), shadow intensifies, accent underline on title.

## States
- Default, Hover, Focus, Selected, Disabled.
- Loading skeleton mimic layout with shimmering effect.
- Error state displays fallback message when data missing.

## Responsiveness
- Grid layout 3 columns desktop, 2 tablet, 1 mobile.
- Maintain consistent card height using min-height and content clamps.
- Ensure images scale responsively and maintain aspect ratio.

## Accessibility
- Entire card clickable? Provide `role="link"` and descriptive aria labels.
- For nested buttons, ensure focus order logical and not duplicated.

## Implementation Notes
- Cards built as reusable components with props for `variant`, `image`, `title`, `meta`, `cta`.
- Content managed via CMS; provide fallback copy for missing fields.
- Track analytics events for card interactions to measure engagement.
