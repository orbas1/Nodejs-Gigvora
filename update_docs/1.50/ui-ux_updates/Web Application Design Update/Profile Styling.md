# Profile Styling Guidelines – Web Application v1.50

## Colour Application
- Background: `--neutral-50` with gradient accent block `linear-gradient(135deg, rgba(12,43,92,0.12), rgba(63,127,227,0.08))` behind header.
- Badges: Verified uses `--accent-500` with white icon; pending uses `--warning-500` with dark text.
- Skill chips: Outline variant by default, filled accent for top 3 skills.

## Typography
- Name uses `heading-1` token; subtitle uses `body-1` medium weight.
- Section headings use `heading-3` with uppercase transform and letter spacing 0.12em.
- Body copy uses `body-2`; metadata (dates, durations) use `caption` with neutral-500 colour.

## Spacing
- Header padding: 32px top/bottom, 40px left/right.
- Section spacing: 24px between sections, 16px between items within sections.
- Avatar margin: 16px bottom on mobile to avoid clash with text.

## Components
- Document list uses table style with alternating background rows for readability.
- Review cards adopt 12px radius, drop shadow level 1, quote icon accent.
- CTA row uses flex gap 12px, wraps at `sm` breakpoint.

## Responsive Rules
- On `sm` screens, reflow to stacked layout with sections collapsed under accordions.
- Quick actions convert to icon-only buttons with tooltip labels on `xs` screens.
