# Web Application Wireframe Changes — Version 1.50

## Objective
The desktop and responsive web experience received an end-to-end restructuring to align with updated messaging, accessibility targets, and conversion goals. Wireframes detail reorganised navigation, modular content sections, and responsive behaviours for marketing and logged-in experiences.

## Global Navigation
- **Pre-Auth Navigation Bar:** Persistent header with logo, mega-menu triggers (Solutions, Industries, Resources), pricing link, and CTA buttons (Log in, Get Started). Sticky behaviour with shrink animation on scroll.
- **Post-Auth Navigation Bar:** Reordered primary links to **Feed → Explore → Create → Dashboard → Profile**; profile avatar opens expanded drop-down with account, finance, admin, agency, company, mentorship, creation studio, settings, and logout actions.
- **Utility Strip:** Secondary strip for language selector, contact sales, status badge (System Status/Updates), and contextual alerts.
- **Footer Architecture:** Multi-column layout featuring company, resources, legal, and community links plus newsletter signup and social proof badges.

## Landing Page Wireframes
1. **Hero Section**
   - Split layout with left-aligned headline/subhead, primary CTA, secondary CTA, and trust proof badges; right side features animated illustration representing collaboration.
   - Background includes subtle animated skill cloud; hero CTA bar persists on mobile as sticky bottom bar.
2. **Value Pillars**
   - Three cards detailing Marketplace, Managed Services, and Workforce Analytics. Each includes icon, supporting copy, and "Learn More" link.
3. **Social Proof**
   - Carousel of testimonials with client logos, role tags, and result metrics; includes pause/play controls and accessible focus states.
4. **How It Works**
   - Stepper module with interactive hover states and inline video preview.
5. **Pricing Preview**
   - Toggle between Monthly/Annual; cards display features, recommended tiers, add-on footnotes, and "Compare plans" link.
6. **Resource CTA**
   - Grid of blogs, webinars, and whitepapers with tags and reading time.
7. **Footer Promo**
   - Global CTA for scheduling demo, newsletter input, and social icons.

## Logged-In Dashboard Wireframes
- **Overview Banner:** Greeting, current plan status, quick stats, and button to upgrade.
- **KPI Cards:** Row of four cards with trend charts, tooltips, and quick filters.
- **Activity Timeline:** Chronological feed of team actions, gig milestones, alerts, and community highlights.
- **Tasks Widget:** Task list with checkboxes, due dates, assign options, and dependency indicators.
- **Insights Panel:** Right column showing performance snapshots, recommended actions, cross-surface nudges, and link to analytics.
- **Calendar Snapshot:** Monthly calendar overlaying gigs, interviews, mentoring, volunteering, and events with colour-coded tags.
- **Inbox Preview:** Compact view of unread conversations and high-priority notifications.

## Solutions Pages Wireframes
- Hero with targeted messaging and CTA, accompanied by context image.
- Sectioned content with alternating image/text blocks, bullet highlights, and testimonials.
- Sticky vertical navigation for long-form pages to jump to sections (Overview, Benefits, Integrations, Case Studies, FAQs).
- Embedded case study cards with quotes and metrics.

## Role-Based Panel Wireframes
### Admin Control Center
- Multi-tab layout (Users, Permissions, Audit Logs, Security, Billing) with data tables, action drawers, and status banners.
- Overview widgets summarising active sessions, pending approvals, and compliance alerts.

### User Panel
- Personalised feed combining bookings, tasks, learning modules, and community invitations.
- Sidebar quick actions for account preferences, finance settings, and saved items.

### Freelancer Panel
- Gig pipeline board (Leads, Applied, Interviewing, Active, Completed) with drag-and-drop functionality and analytics overlays.
- Earnings dashboard summarising payouts, invoices, and projections.

### Company & Agency Panels
- Company panel emphasises hiring pipeline, workforce analytics, and cross-team collaboration timeline.
- Agency panel provides multi-brand switcher, HR compliance dashboard, and broadcast announcements module.

### Headhunter & Mentorship Panels
- Headhunter workspace with candidate sourcing table, interview scheduler, and offer management queue.
- Mentorship panel featuring match suggestions, session calendar, progress tracking, and resource library access.

### Creation Studio & Experience Launchpad
- Studio workspace with modular editor, asset library, version history, and publishing controls.
- Launchpad checklist guiding new experience setup with milestone tracker, mentor assignment, and marketing checklist.

### Networking & Volunteering Hubs
- Networking lounge with live room tiles, attendee preview, and schedule of upcoming speed networking events.
- Volunteering marketplace combining map and list views, filter panel, and opportunity detail drawer.

### Project & Gig Management Views
- Project management view offering kanban, timeline, and workload heatmap modes.
- Gig management console with searchable list, status filters, and quick action drawer for reschedule, assign, or message.

### Interview & Recruiting Modules
- Job listing manager with creation wizard summary, performance metrics, and syndication controls.
- Interview management board merging calendar, candidate stages, interviewer availability, and scorecard access.
- Interview room layout with video embed, shared notes, evaluation panel, and resource sidebar.

### Finance & Commerce Interfaces
- Purchase page with plan comparison, add-on selector, ROI calculator, and testimonials.
- Checkout wizard with progress tracker, billing forms, payment method selection, and compliance acknowledgement step.
- Budget management dashboard featuring allocation chart, burn-rate trends, variance alerts, and approval workflow.
- Invoice and payments ledger table with filters, export tools, and bulk action toolbar.

### Messaging, Inbox, & Support
- Unified communications center showing inbox, notifications, tasks, and knowledge base suggestions.
- Chat bubble overlay accessible across app with thread search, quick replies, and connection to support escalation flow.

### Static & Legal Pages
- Profile page with hero summary, metrics, testimonials, timeline, and editing drawer.
- About Us, Terms & Conditions, Privacy Policy redesigned with hero intro, anchored navigation, and compliance callouts.

## Resources Hub Wireframes
- **Filterable Grid:** Search bar, filter chips (Content Type, Industry, Role), and sort options.
- **Content Cards:** Include thumbnail, title, description, resource type icon, and CTA.
- **Featured Resource Spotlight:** Large hero card at top for latest event or report.
- **Pagination Controls:** Numeric pagination with quick jump to top.

## Support & Help Wireframes
- Knowledge base layout with search, categories, trending articles.
- Support contact widget with options for chat, email, phone, and community forum.
- Status page embed with uptime stats and incident history.

## Responsive Behaviour
- Breakpoints defined for 320, 480, 768, 1024, 1280, and 1440px.
- Navigation condenses to hamburger menu on ≤1024px with slide-in drawer.
- Hero image repositioned below content on mobile; CTAs stack vertically.
- Tables convert to card stacks with key metrics emphasised.
- Footer collapses into accordions on mobile for easier scanning.

## Accessibility Considerations
- Ensured focus order, skip navigation link, and high-contrast callouts.
- Added ARIA labels to mega-menu triggers and interactive cards.
- Provided keyboard controls for carousels and steppers.

## Testing Notes
- Remote usability sessions validated new landing structure; improved comprehension of offerings.
- A/B tests planned for hero CTA copy and pricing card layout.
- Analytics events instrumented for mega-menu interactions, pricing toggles, and demo submissions.

## Next Steps
- Transition wireframes into high-fidelity designs with updated brand photography.
- Collaborate with marketing to ensure content readiness for new sections.
- Align with engineering on responsive behaviour feasibility and animation performance.
