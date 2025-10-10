# Pricing & Package Design – Web Application Version 1.00

## Page Structure
- Hero banner with gradient background, headline "Choose the right plan for your team", supporting copy, CTA buttons (`Start free`, `Talk to sales`).
- Pricing toggle (Monthly/Annual) using pill segmented control 48px height.
- Pricing cards displayed in 3-column grid; featured plan elevated with accent border.

## Card Specs
- Dimensions: 360×560px desktop, 100% width mobile.
- Header includes plan name, short descriptor, price (uses `display-xl` for figure). Annual toggle applies 15% discount label.
- Feature list uses check icons 20px; list items 14px `#475569`.
- CTA button full width (primary for featured, secondary for others). Secondary actions `View details` as tertiary link.

## Add-ons Section
- Horizontal slider listing add-ons (Talent Insights, Advanced Analytics, Enterprise Support). Cards 320×240px with gradient backgrounds.

## Comparison Table
- Sticky header row, columns for Essential, Growth, Scale. Table width `min(960px, 100%)` with horizontal scroll on mobile.
- Use checkmarks and dashes to represent availability.

## Visual Style
- Featured card background `linear-gradient(135deg,#1D4ED8,#2563EB)`, white text, drop shadow accent.
- Other cards white background, subtle shadow.

## Trust Signals
- Row of customer logos, testimonial snippet specific to pricing.
- FAQ accordion below pricing table.

## Analytics
- Track toggle usage (`web.v1.pricing.toggle`), CTA clicks per plan, and add-on detail expansions.

## Accessibility
- Provide ARIA labels for toggle ("Billing frequency").
- Ensure price text includes `/month` or `/user` for screen readers.
