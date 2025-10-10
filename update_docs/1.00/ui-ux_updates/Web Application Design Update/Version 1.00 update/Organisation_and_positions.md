# Layout Organisation & Element Positioning – Web Application Version 1.00

## Global Positioning Rules
- Maintain 32px base gutter; adjust via clamp for responsive scales.
- Align hero imagery to right edges with 48px offset to avoid clipping.
- Sticky header fixed at top with `z-index: 40`, ensures content offset `padding-top: 88px` on pages with hero band.

## Section Positioning
- **Hero:** Headline baseline aligns with hero CTA row, metrics positioned 48px below CTA buttons.
- **Feature Grid:** Cards align to baseline of previous section via `margin-top: 96px`.
- **Opportunity Highlights:** Left column anchored to top of right column for consistent vertical rhythm.
- **Testimonials:** Slider centered with `max-width: 1240px`, arrow controls positioned 40px outside card edges.

## Component Placement
- Buttons with icons align icon centre to label x-height; maintain `gap: 12px`.
- Chips align to baseline of associated text to avoid misalignment.
- Avatars overlapping hero card offset `-32px` to create layered effect.

## Dashboard Specifics
- Metric row sits flush to header with `margin-top: -56px` to emphasise integration.
- Quick action button floats bottom-right with `bottom: 32px`, `right: 32px` on desktop; `bottom: 24px`, `right: 24px` mobile.

## Profile Page Positioning
- Avatar centred horizontally on mobile; left-aligned with content on desktop.
- Sidebar sticky top 120px ensures alignment with start of About section.

## Responsive Alignment
- Under 768px, convert hero grid to column stack; metrics wrap to two columns with `justify-content: center`.
- On 3xl screens, maintain content max width 1440px to prevent overly wide lines.

## Spacing Tokens
| Token | Value | Usage |
| --- | --- | --- |
| `space-xs` | 12px | Chip gaps |
| `space-sm` | 16px | Button spacing |
| `space-md` | 24px | Card interior spacing |
| `space-lg` | 32px | Section internal spacing |
| `space-xl` | 48px | Section separation |
| `space-xxl` | 96px | Hero separation |

## Layering
- Orb backgrounds positioned with `z-index: -1` to sit behind cards.
- Sticky filter bars `z-index: 30` to sit below header but above content.

## Motion Alignment
- Entrance animations triggered sequentially from top to bottom with 120ms offsets to maintain eye flow.
