# Web Menu Specifications — Version 1.50

## Menu Types
- **Primary Navigation** with mega-menu (pre-auth) and authenticated layout ordered **Feed → Explore → Create → Dashboard → Profile**.
- **Secondary Section Navigation** for long-form pages.
- **Footer Navigation** with quick links.
- **Utility Menu** for language, contact sales, system status.

## Mega-Menu Structure
- Columns: Solutions, Industries, Resources, Company.
- Include featured item per column with image/icon and short description.
- Support promo banner for campaigns.

## Interaction Guidelines
- Hover or click to open; delay 150ms to avoid accidental triggers.
- Close on escape, outside click, or focus loss.
- Maintain focus trap; arrow keys navigate columns and items.
- Provide subtle fade/slide animation (120ms ease-out).

## Content Guidelines
- Use concise labels (≤3 words) and supporting copy (≤80 characters).
- Group related links; use dividers for separation.
- Include icons for high-priority links (demo, pricing).
- Authenticated profile drop-down includes Account Preferences, Finance Settings, Admin Control Center, Agency Management, Company Management, Freelancer Panel, Headhunter Panel, Mentorship Hub, Creation Studio, and Logout options.

## Accessibility
- Menu trigger `aria-expanded` and `aria-controls` referencing menu panel.
- Provide skip navigation link at top of page.
- Ensure items accessible via keyboard; highlight focus with visible ring.

## Responsive Behaviour
- Collapse to hamburger menu on ≤1024px; slide-in drawer with accordions.
- Provide search bar within mobile menu for quick navigation.
- Keep critical CTAs (Get Started) persistent above fold.

## Implementation Notes
- Built as reusable component with configuration for columns and items.
- Supports analytics events for menu open/close and link clicks.
- Provide theming tokens for background, text, and hover states.
