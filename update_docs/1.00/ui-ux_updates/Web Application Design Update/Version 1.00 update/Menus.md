# Navigation & Menu Structure – Web Application Version 1.00

## Global Header Menu
- Items: Home, Live Feed, Explorer, Jobs, Gigs, Projects, Launchpad, Volunteering, Groups, Resources.
- Right-hand actions: Login (secondary button), Join Now (primary button).
- Provider logged-in view replaces Join Now with `Post opportunity` pill.

## Dropdowns
- `Explorer` reveals mega dropdown on hover (desktop) 720px width, two columns: `Discover` (Explorer, Launchpad, Volunteering) and `Solutions` (For Teams, For Talent, For Nonprofits). Includes CTA at bottom `Talk to sales`.
- `Resources` dropdown 640px width containing articles, webinars, support links.

## Mobile Menu
- Full-screen overlay `background: #0B1B3F`, text white.
- Navigation items stacked with `gap: 20px`. Buttons `Join Now` (full width) and `Login` (outline) at bottom.
- Include social icons row `gap: 16px`.

## User Menu
- When authenticated, avatar menu includes: Dashboard, Profile, Saved items, Settings, Billing, Logout.
- Dropdown width 280px, `border-radius: 20px`, `box-shadow: var(--shadow-medium)`.

## Provider Quick Menu
- Additional top-level link `Provider Console` visible to provider roles.
- Provide `Post opportunity` CTA pinned to header right.

## Footer Menu
- Columns: Product, Solutions, Company, Resources, Legal.
- Secondary row for `Privacy`, `Terms`, `Security`, `Status`. Include status badge with `Operational` state.

## Accessibility
- All dropdowns accessible via keyboard (`Tab`, `Arrow` keys). Provide `aria-expanded`, `aria-controls`.
- Mobile menu trap focus when open; close on `Esc`.

## Analytics
- Track nav interactions via `web.v1.nav.<item>.click` events with attributes (deviceType, menuType).
