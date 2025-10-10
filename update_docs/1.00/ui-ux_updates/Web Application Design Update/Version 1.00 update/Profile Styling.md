# Profile Styling Specifications – Web Application Version 1.00

## Typography
- Name: `heading-lg` (clamp 32–40px) weight 700.
- Headline: `heading-sm` 500 weight, color `#E0F2FE` overlay with drop shadow `0 2px 8px rgba(11,27,63,0.35)` to ensure readability.
- Body copy: `body-md` `#0B1B3F`.

## Colour Treatment
- Header gradient `#1D4ED8 → #2563EB` with overlay orb `#38BDF8` at 40% opacity.
- Sidebar background `#FFFFFF` with `shadow-soft` and `border: 1px solid rgba(226,232,240,0.8)`.
- Skill chips `#DBEAFE` background, text `#1D4ED8`, icon `#1E40AF`.
- Availability pill states: Available `#DCFCE7`/`#166534`, Booked `#FEE2E2`/`#991B1B`, Open to discuss `#FEF3C7`/`#B45309`.

## Layout & Spacing
- `main` content width `min(900px, 100%)`; `gap: 48px` between sections.
- Sidebar `position: sticky` top 120px.
- Section headings use uppercase eyebrow `#60A5FA` and 12px letter spacing.

## Components
- `ExperienceItem`: uses timeline line `width: 4px` `#DBEAFE`, node `16px` with inner dot `#2563EB`.
- `PortfolioTile`: `border-radius: 24px`, overlay gradient `linear-gradient(180deg,rgba(15,23,42,0) 0%,rgba(15,23,42,0.75) 100%)`.
- `RecommendationCard`: 360×220px, background `#FFFFFF`, border `#E2E8F0`, includes quote icon `#2563EB`.

## Interactions
- Hover on action buttons uses accent lighten by 10% and `translateY(-2px)`.
- Skill chips clickable; on hover background deepens to `#BFDBFE`.
- Sidebar contact icons enlarge to 110% on hover with `transition: 180ms ease-out`.

## Responsive Behaviour
- On ≤1024px, sidebar moves below content with `margin-top: 48px`.
- Avatar centre-aligned; action buttons full-width stacked (primary then secondary, tertiary).
- Timeline reduces spacing to 72px and nodes 12px.

## Accessibility
- Provide text alternatives for badges (use `aria-label`).
- Ensure timeline uses ordered list semantics for chronological clarity.

## Assets
- Background pattern `dots.svg` tinted `rgba(37,99,235,0.08)`.
