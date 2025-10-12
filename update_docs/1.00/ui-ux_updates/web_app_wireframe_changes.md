# Web App Wireframe Changes – Version 1.00

## Global Layout & Navigation
- **Header:** Sticky top bar with logo, nav links (Home, Live Feed, Explorer, Jobs, Gigs, Projects, Launchpad, Volunteering, Groups) plus conditional items (Dashboard, Launch Project, Auto-Assign, Trust Center) when authenticated; avatar pill exposes logout on desktop and mobile drawers.
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
- **Detail view:** Routed page with hero summary, structured content tabs (Overview, Requirements, Compensation, Company), sticky CTA column, and related opportunities grid.
- **Alert banners:** Inline notifications for verification requirements or saved searches available for login state.
- **Auto-assign cues:** Eligible listings display a pill labeled "Auto-assign" with countdown chip. Detail pages surface a slide-over summarising assignment settings (acceptance window, score breakdown) and offer "Decline"/"Accept" actions for matched freelancers.

## Auto-Assign Queue Page
- **Route:** `/auto-assign` accessible from the header notification icon when pending assignments exist; icon badges remaining count.
- **Layout:** Two-column layout with queue table left and detail drawer right. Table columns: Opportunity, Type, Score, Time remaining, Status, Actions.
- **Detail drawer:** Exposes score breakdown bars, required skills list, launchpad alignment, payout summary, and history of previous offers. Buttons for Accept, Decline, and Extend timer pinned to footer.
- **History filter:** Secondary tab shows completed assignments with search and export controls feeding provider analytics.
- **Empty state:** Illustration and CTA to update preferences when no active assignments remain.

## Groups & Connections Pages
- **Groups:** Grid of group cards with cover image, member count, join button, and tags; detail view with posts & events.
- **Connections:** Two-column layout showing suggestions on left and pending invites on right; includes "Import contacts" CTA.
- **Member detail:** Modal with avatar, summary, shared connections, and quick connect message field.
- **Event board:** Calendar/list toggle for group events with RSVP buttons and share links.

## Projects Page
- **Overview banner:** Highlights fairness-first auto-assign, queue telemetry, and a primary CTA to create or manage projects.
- **Listing cards:** Surface status, updated-at timestamp, rotating collaborator avatars, auto-assign status pill, and "Manage project" link that opens the detailed workspace.
- **Detail workspace:** Two-column layout with metadata form (title, description, status, location, budget), fairness sliders, newcomer toggle, and queue regeneration controls alongside a queue snapshot list and activity log feed.
- **Queue snapshot:** Card stack showing priority order, score, newcomer boost, and countdown chips with quick regenerate CTA and analytics callouts.
- **Project creation flow:** Slide-over form capturing project basics, budget, location, and optional auto-assign configuration with fairness previews before launch.

## Operations Dashboard
- **Hero:** Eyebrow "Dashboard", h1 greeting, supporting copy, and `DataStatus` chip showing last sync with manual refresh.
- **Stats grid:** Four cards summarising active projects, assignments in flight, saved searches, and portfolio value.
- **Main grid:** Left column lists freelancer queue entries; right column stacks project queue summary, saved-search tray, and owned-project cards.
- **Activity feed:** Timeline of project events with links to detail pages, JSON payload preview, and timestamps.
- **Profile tile:** Avatar, headline, and assignment metrics (rating, completion rate, completed projects) in muted card.
- **Auto-assign health:** Column summarising pending/notified/expired counts and next action timestamp.

## Launchpad Experience
- **Hero band:** Program explanation, cohort stats, CTA to explore tracks.
- **Track cards:** Each shows track focus, duration, mentors, and register CTA.
- **Success stories:** Carousel of alumni achievements.
- **Curriculum outline:** Accordion listing modules with badges for live/async sessions, prerequisites, and downloadable resources.
- **Mentor roster:** Card grid with mentor bios, expertise tags, and contact CTA for accepted participants.

## Volunteering Hub
- **Mission cards:** Display organisation, role, commitment, location, and apply CTA.
- **Impact stats:** Visual summary of volunteer hours and partner NGOs.
- **Filter stack:** Duration, cause area, remote toggle.
- **Mission detail:** Tabbed layout for overview, requirements, logistics, organiser profile, and testimonials.
- **Availability scheduler:** Inline calendar for selecting volunteer shifts with confirmation modal.

## Profile Page
- **Header:** Cover gradient, avatar, action buttons.
- **Content sections:** About, Experience, Projects, Portfolio, Launchpad progress, Volunteering timeline, Recommendations.
- **Sidebar:** Contact info, badges, social links, share profile CTA.
- **Edit profile overlay:** Multi-step wizard with autosave, preview mode, and validation summary.
- **Share modal:** Offers copy link, share to LinkedIn/Twitter, and download PDF resume.

## Responsive Behaviour
- Breakpoints adjust nav to hamburger, convert grids to stacked cards, and collapse sidebars under content.
- CTA buttons expand to full width under 768px; forms switch to single-column.
- Radial backgrounds scale/shift to avoid clipping on mobile.
- Medium screens (768–1024px) introduce sticky sub-nav for long-form detail pages; ensures quick jumps between sections.
- Desktop >1440px adds max-width wrappers plus background illustration offsets to prevent white space imbalance.

## Documentation Reference
- Detailed measurements, component tokens, and content guidelines now reside in `Web Application Design Update/Version 1.00 update/` to support build hand-off and QA traceability.
