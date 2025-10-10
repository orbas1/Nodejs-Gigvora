# Screen Inventory – Phone Application v1.00

| Screen | Primary Purpose | Entry Points | Layout Notes |
| --- | --- | --- | --- |
| Feed | Curated activity feed mixing network updates, opportunities, and launchpad milestones. | Default route `/feed`, notifications deep links, share intents. | Nested `CustomScrollView` with hero header (120dp), sticky filter chips, modular feed cards (max width 344dp). |
| Explorer | Unified search/discovery with category pivoting. | Bottom nav, search icon from feed, voice search. | Full-width search pill (56dp), horizontal segmented control, results list with skeleton placeholders. |
| Marketplace Hub | Category selector bridging Jobs, Gigs, Projects, Launchpad programs, Volunteering. | Bottom nav hub, CTA from feed/explorer. | TabView with `SliverAppBar`, pinned CTA banner, `PageView`-controlled content rail. |
| Jobs List | Browse employment opportunities. | Marketplace hub, push from explorer. | `ListView` of card modules, 16dp vertical rhythm, inline metadata chips. |
| Gigs List | Short-term work offers. | Marketplace hub. | Shares Jobs template with altered CTA copy and iconography. |
| Projects List | Collaboration projects. | Marketplace hub. | Adds milestone progress ring per card (40dp). |
| Launchpad Programs | Entrepreneurship accelerator opportunities. | Marketplace hub, Launchpad nav. | Card stack with gradient hero, timeline badges row. |
| Volunteering Missions | Volunteer engagements. | Marketplace hub, Volunteering nav anchor. | Map preview ribbon (120dp) + mission cards with organisation avatars. |
| Opportunity Detail | Deep dive for any opportunity type. | Cards CTA, notifications, saved items. | Scrollable detail sheet with hero image (240dp), meta chips, requirements accordion, action bar pinned to bottom. |
| Profile | Personal brand, stats, portfolio. | Bottom nav, mentions. | Collapsing toolbar with gradient cover, segmented content sections, CTA row. |
| Profile Edit | Update personal details, skills. | Profile CTA. | Multi-section form with stepper and sticky Save bar. |
| Launchpad Dashboard | Track program progress, badges. | Launchpad nav after joining. | Card grid (2 columns on tablets), progress bars, timeline list. |
| Volunteering Dashboard | Manage commitments, hours log. | Volunteering nav when enrolled. | Calendar ribbon, mission cards, CTA to log hours. |
| Notifications Centre | Aggregated push history. | Top app bar bell, system notifications. | Modal sheet (max height 640dp) with grouped list, CTA row (Mark all read). |
| Inbox | Messaging hub. | Profile menu, notifications. | Two-tab `SegmentedButton`, conversation list (80dp rows), message view with composer. |
| Settings | Account + preferences. | Profile overflow, onboarding. | Sectioned list with toggles, accordions, CTA to support. |
| Support Hub | Knowledge base + contact. | Settings, offline banners. | Search field, featured articles grid, contact cards. |
| Login | Returning user entry. | Launch route when not authenticated. | Centered card (max 320dp), gradient backdrop, CTA pair (Login/SSO). |
| Register (Individual) | Capture personal onboarding data. | Login CTA. | Stepper with `PageView` pages, progress indicator, validation states. |
| Register (Company) | Organisation onboarding. | Register flow toggle. | Additional compliance form, company branding upload. |
| Admin Login | Secure access for operations team. | Hidden entry from login. | Dark theme card with OTP fallback, audit reminder banner. |
| Welcome Tour | Post-signup orientation. | Completed registration. | Carousel with 3 slides, illustration asset, CTA (Personalise now). |
| Offline State | Provide offline guidance. | Triggered when network unavailable. | Full-screen sheet with illustration, retry button, cached data summary. |
| Error State | Provide recovery steps for fatal errors. | Unhandled failure. | Centered card, icon, support CTA, log reference ID. |
