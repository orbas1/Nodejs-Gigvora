# Web App Wireframe Changes – Version 1.00

## Global Layout & Navigation
- **Header:** Sticky top bar with logo, nav links (Home, Live Feed, Explorer, Jobs, Gigs, Projects, Launchpad, Volunteering, Groups), and auth CTAs (Login, Join Now). Mobile menu collapses into slide-down drawer with same actions.
- **Body background:** Gradient canvas with radial accent highlights; content constrained to 6–7 columns for readability.
- **Footer:** Multi-column footer with product links, legal, community resources, and social icons; background tinted darker slate for contrast.

## Homepage
1. **Hero section:** Left column houses eyebrow badge, h1, supporting copy, CTA buttons; right column features live feed preview card showing sample posts.
2. **Partner strip:** Horizontal logo carousel with tinted background and subtle separators.
3. **Feature grid:** Three-column cards describing Marketplace, Collaboration, Insights with iconography.
4. **Momentum & stats:** Metric cards showing talent count, opportunities, match time; timeline of growth milestones.
5. **Opportunities highlights:** Split layout for Jobs, Projects, Launchpad, Volunteering each with CTA linking to relevant pages.
6. **Testimonials:** Slider of customer quotes with avatars and gradient accent.
7. **CTA footer:** Bold callout encouraging signup with accent background and button pair.

## Authentication
- **Login page:** Two-column layout with illustration panel, login card (email, password, remember me, CTA), social login placeholders, forgot password link.
- **Register page:** Multi-step form with progress indicator; sections for personal info, skills/interests, verification.
- **Company registration:** Extended form capturing organisation details, compliance agreements, and billing setup; summary panel on right.
- **Admin login:** Focused page with security messaging, email/password fields, OTP fallback, and contact compliance CTA.

## Feed Page
- **Header strip:** Title, description, and CTA to "Share update".
- **Filters:** Horizontal chips (All, Opportunities, Launchpad, Groups) with accent active state.
- **Post cards:** Avatar, name, badge, timestamp, body, media preview, reaction toolbar, comment preview.
- **Side rail:** Widgets for trending topics, recommended connections, and knowledge base articles.

## Search / Explorer Page
- **Page header:** Eyebrow "Explorer", h1, descriptive copy, and metadata component showing loading/cache/refresh states.
- **Search bar:** Full-width input with icon, clear button, and keyboard shortcuts.
- **Category selector:** Column of pill buttons; selection drives results area.
- **Results grid:** Card layout with badge, title, snippet, meta chips, last-updated, CTA button.
- **Empty/error states:** Dedicated cards with icon, message, and reset action.

## Jobs / Gigs / Projects / Launchpad / Volunteering Pages
- **Hero:** Title, subtitle, supporting copy tailored per vertical.
- **Filter row:** Search input, filter dropdowns (Location, Type, Remote), toggle for saved opportunities.
- **Opportunity list:** Card stack with meta chips, description, CTA button; includes bookmark icon.
- **Insights sidebar:** Stats on number of listings, average budgets, recommended actions.
- **Pagination:** Load more button or infinite scroll with progress indicator.

## Groups & Connections Pages
- **Groups:** Grid of group cards with cover image, member count, join button, and tags; detail view with posts & events.
- **Connections:** Two-column layout showing suggestions on left and pending invites on right; includes "Import contacts" CTA.

## Projects Page
- **Overview banner:** Highlights project workspace features with CTA to create project.
- **Tabs:** Active projects, Archived, Templates; each uses card list with progress bars and team avatars.
- **Detail card:** Summary, upcoming milestones, and quick actions (Open board, Message team, Add files).

## Launchpad Experience
- **Hero band:** Program explanation, cohort stats, CTA to explore tracks.
- **Track cards:** Each shows track focus, duration, mentors, and register CTA.
- **Success stories:** Carousel of alumni achievements.

## Volunteering Hub
- **Mission cards:** Display organisation, role, commitment, location, and apply CTA.
- **Impact stats:** Visual summary of volunteer hours and partner NGOs.
- **Filter stack:** Duration, cause area, remote toggle.

## Profile Page
- **Header:** Cover gradient, avatar, action buttons.
- **Content sections:** About, Experience, Projects, Portfolio, Launchpad progress, Volunteering timeline, Recommendations.
- **Sidebar:** Contact info, badges, social links, share profile CTA.

## Responsive Behaviour
- Breakpoints adjust nav to hamburger, convert grids to stacked cards, and collapse sidebars under content.
- CTA buttons expand to full width under 768px; forms switch to single-column.
- Radial backgrounds scale/shift to avoid clipping on mobile.
