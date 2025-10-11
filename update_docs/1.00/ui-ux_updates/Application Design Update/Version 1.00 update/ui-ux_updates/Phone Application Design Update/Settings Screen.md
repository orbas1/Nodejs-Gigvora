# Settings Screen Design – Phone Application v1.00

## Layout
- Top app bar with title "Settings" (Inter 20/28) and close/back icon 24dp.
- Search field below app bar (height 48dp, placeholder "Search settings"), includes leading search icon and trailing clear button.
- Content list segmented by section headers (Inter 14/20 uppercase, colour `#475569`).
- Each row 56dp height with 20dp horizontal padding, icon 24dp left (if applicable), text column (title 16/24, subtitle 14/20 secondary), trailing control (switch, chevron, button).
- Section separators: 16dp vertical spacing with divider line `#E2E8F0` 1dp preceding new section.
- Footer contains support summary card (background `#DBEAFE`, radius 16dp) with copy and `Contact support` button.

## Interactions
- Search results highlight matching text (accent `#2563EB`) and collapse other sections.
- Switch toggles animate (duration 180ms). When toggled, inline snackbar at bottom shows "Preference saved" with undo (for toggles where applicable).
- Tapping rows with chevron navigates to detail pages (e.g., Notification preferences) via slide-in from right (200ms ease).
- Delete account row tinted `#FEE2E2`; tapping opens confirmation modal with warning icon.

## Responsive Behaviour
- Tablet layout adds left column navigation rail listing sections; list content scrolls independently on right.
- When keyboard open (search), list scroll adjusts to keep results visible above keyboard.

## Accessibility
- Provide `Semantics` labels combining title + state (e.g., "Opportunity alerts, enabled").
- Support TalkBack focus order top to bottom; search field receives focus on open for quick typing.

## Implementation Notes
- Use `ListView.separated` for consistent spacing; create data model for sections/rows to map into widgets.
- Search uses `TextEditingController` with `ValueListenableBuilder` to filter list.
- Sticky header support via `SliverAppBar` when scroll >120dp to keep section context visible.
- Provide `ScrollController` method `scrollToSection(String id)` to support deep links from notifications/support.

## Additional States
- When data export job in progress, show inline progress tile with cancel button (outline variant). Completed job displays download button (primary) and expiry text 12/16 secondary.
- Settings search with no results displays empty state card (illustration 120×120) and CTA to contact support.
- Offline state surfaces banner at top with "Changes sync when online" message; toggles remain available but show queued indicator dot (6dp) until synced.
