# Resources & Knowledge Base Requirements – Web Application Version 1.00

## Resource Types
- Playbooks (PDF)
- Webinars (Video)
- Case Studies (Article)
- Templates (Spreadsheet/Docs)
- Policy Guides (Markdown)

## Layout
- Hero with search (width 720px) and filter chips (Topic, Format, Industry).
- Resource grid `grid-template-columns: repeat(auto-fit,minmax(280px,1fr))`.
- Each card includes type icon, title, excerpt, `View` CTA, metadata (format, duration/pages).

## Filters & Sorting
- Sort dropdown (Most recent, Most popular, Recommended).
- Filter drawer for topic multi-select; persistent state stored in query params.

## Detail Page
- Banner with breadcrumb, title, summary, CTA (Download or Watch).
- Body uses 760px column width, `line-height: 1.7`.
- Provide related resources at bottom (3 cards) and CTA to contact support.

## Assets
- Icons from `Feather icons` set for format (file-text, video, layers, shield).
- Cover imagery using gradient overlays tinted `#2563EB`.

## Accessibility
- Provide text alternatives for downloadable files ("Download the Marketplace Compliance Checklist PDF").
- Video resources include transcript section.

## Analytics
- Track downloads and views via `web.v1.resources.<type>.<action>`.
- Expose `resourceId`, `format`, `topic` for analytics payload.

## Content Governance
- Content managed in CMS; provide `lastUpdated` and `author`. Show compliance review badge when required.
