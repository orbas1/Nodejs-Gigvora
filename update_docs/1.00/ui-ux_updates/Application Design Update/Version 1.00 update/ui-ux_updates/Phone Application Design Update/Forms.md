# Form Design Specifications – Phone Application v1.00

## Input Components
- **Text Fields:** Rounded rectangle, height 56dp, corner 14dp, border 1dp `#CBD5F5`. Focus border 2dp `#2563EB`. Label floats above, font Inter 14/20 medium.
- **Dropdowns:** Same base as text fields with chevron icon 20dp; bottom sheet for selection when >6 options.
- **Chips/Tags Input:** Multi-select chips from `FilterChipRow`, allow free text with suggestions.
- **Date/Time Pickers:** Use Material modal pickers with custom accent (#2563EB). Provide summary chips once selected.
- **File Upload:** Card with dashed border `#94A3B8`, icon 32dp, text "Upload document"; shows file preview with status badge once uploaded.

## Validation & Feedback
- Inline error text (Inter 12/16 medium, colour `#DC2626`) displayed beneath field with icon `error_outline` 16dp.
- Success confirmation uses subtle check icon `#16A34A` and optional toast.
- Provide helper text (Inter 13/18) between label and field for context (e.g., "Appears on your public profile").

## Layout Patterns
- Forms use vertical rhythm 16dp between fields, grouped sections separated by 24dp heading.
- Multi-step forms (registration, company onboarding) use `PageView` with stepper at top; show progress summary at bottom ("Step 2 of 3").
- Save/Continue CTA pinned to bottom with safe area padding 16dp, offering primary and secondary actions.

## Accessibility
- All form controls labelled using `Semantics` widgets with descriptive hints.
- Touch targets at least 48dp; toggles 52×28dp with 12dp spacing from label.
- Support screen readers by ordering focus logically and providing `TextInputAction.next` to move through fields.

## Special Flows
- **Apply/Pitch:** Pre-fill user profile data, show summary card at top; require review of terms via checkbox (unchecked by default).
- **Log Volunteer Hours:** Use numeric keypad, pre-set increments (0.5, 1, 2 hours) as chips; require location/time description.
- **Security Settings:** OTP entry fields use segmented input (6 boxes, 56dp square) with auto-advance and paste support.

## Implementation Notes
- Wrap forms in `Form` + `GlobalKey` for validation; use `FocusScope` to manage keyboard.
- Provide `LoadingButton` variant for asynchronous submissions to show spinner and prevent duplicate taps.
