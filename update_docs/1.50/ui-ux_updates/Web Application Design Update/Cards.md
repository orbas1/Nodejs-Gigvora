# Card Framework – Web Application v1.50

## Card Types
- **Overview metric card:** Summarises KPIs with sparkline and comparison badge.
- **Activity feed card:** Contains avatar, timestamp, action summary, attachments preview.
- **Gig listing card:** Highlights role, rate, skills, location with quick actions (Save, Share, Publish toggle).
- **Project milestone card:** Displays progress bar, due date, next action CTA.
- **Compliance card:** Shows escrow status, verification requirements, outstanding documents.
- **Testimonial card:** Used on marketing home; includes quote, avatar, partner logo.

## Structure
1. Header row containing icon/avatar, label, overflow menu.
2. Body with primary content (metrics, text, image).
3. Footer for actions or metadata; optional progress rails.

## Behaviour
- Cards stack into responsive masonry: 1 column on `xs`, 2 on `sm`, 3 on `md+`.
- Hover states raise elevation to level 1 and reveal quick actions.
- Card width respects grid column spans; content truncation uses multi-line clamp with tooltip for overflow.

## Accessibility
- Entire card clickable only when semantics align (e.g., open details). Otherwise, keep individual buttons with descriptive labels.
- Provide ARIA role `group` and label summarising card content.
- For charts inside cards, include data table accessible via “View data” link.
