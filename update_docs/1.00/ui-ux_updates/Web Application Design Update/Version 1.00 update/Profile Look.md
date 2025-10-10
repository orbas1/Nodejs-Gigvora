# Profile Page Look & Feel – Web Application Version 1.00

## Visual Structure
- **Header Band:** 320px height gradient `linear-gradient(135deg,#1D4ED8,#2563EB)` with overlay orb `#38BDF8`. Contains cover image overlay (optional) at 40% opacity.
- **Avatar:** 128px circle, positioned overlapping header and main card (offset -64px). Border 6px `#F8FAFC`.
- **Primary Info Card:** `border-radius: 32px`, `padding: 32px`, `box-shadow: var(--shadow-soft)`. Contains name, headline, location, availability chip.
- **Action Buttons:** Primary `Message`, secondary `Invite to project`, tertiary `Share profile` (icon button). Buttons arranged horizontal on desktop, stacked mobile.

## Content Layout
1. **About Section** – 2 columns: summary paragraph and key highlights list.
2. **Experience Timeline** – vertical timeline with nodes every 96px, includes company logo 48px, title, achievements.
3. **Portfolio Grid** – 3-column responsive gallery; each tile 360×240px with hover overlay showing description.
4. **Launchpad Progress** – Card showing completed cohorts, badges, percentile ranking.
5. **Volunteering Timeline** – Similar to experience but with accent `#38BDF8` nodes.
6. **Recommendations** – Carousel of testimonial cards.

## Sidebar (Desktop)
- Width 320px; includes contact info (email, website, social links), badges (Top Freelancer, Mentor), and metrics (response time, rating).
- Provide `Download resume` button (secondary) and `Add to favourites` toggle.

## Styling Notes
- Background behind sections `#F8FAFC` with subtle pattern `url('assets/patterns/dots.svg')` at 8% opacity.
- Use chips for skills (`background: #DBEAFE`, text `#1D4ED8`).
- Provide skeleton state with grey blocks for each section to avoid layout shift.

## Accessibility
- Ensure color contrast for gradient header (text in white with shadow). Provide `aria-labels` for action buttons.
- Provide skip to contact info link for screen readers.

## Motion
- On page load, avatar scales from 0.9 to 1 over 220ms to create polish.
- Portfolio hover overlay fade 0 → 0.9 opacity, 200ms ease-out.
