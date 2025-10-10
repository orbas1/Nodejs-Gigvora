# Dashboard Design Specification – Web Application v1.50

## Primary Dashboard (Workspace Overview)
- **Hero band:** Displays organisation switcher, summary KPIs (Active gigs, Pending payouts, Satisfaction score).
- **Grid layout:** First row (12 columns) hosts metric tiles; second row split 7/5 for project pipeline vs compliance alerts.
- **Activity module:** Chronological feed with filters (All, My items, Team) and quick actions (comment, mark done).
- **Insights preview:** Compact chart showing weekly hires vs targets with call-to-action to open full Insights page.

## Launchpad Dashboard
- Checklist component listing onboarding tasks with progress bar and recommended order.
- Support panel offering quick links to knowledge base articles, support chat, and account manager contact.
- Nudges for incomplete compliance steps surface in hero card with CTA.

## Volunteer/Community Dashboard
- Impact metrics (hours donated, beneficiaries reached).
- Highlighted opportunities with filter chips (Remote, In-person, Skills-based).
- Story spotlight card featuring latest community success story.

## Responsive Behaviour
- On `md` breakpoints, convert multi-column grids into stack with pinned KPIs at top.
- Provide overflow carousels for wide tables on `sm` and `xs` screens.

## Accessibility & Performance
- Dashboards support keyboard shortcuts (1-5) to jump between modules.
- Lazy load heavy charts; show skeleton states while fetching.
- Provide export buttons with descriptive alt text for screen readers.
