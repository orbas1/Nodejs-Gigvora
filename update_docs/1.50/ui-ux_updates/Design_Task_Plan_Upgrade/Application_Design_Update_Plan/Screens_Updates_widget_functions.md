# Widget Function Specifications — Application Screens

## Purpose
Define the behaviour, inputs, outputs, and state management for each widget used in redesigned screens to guide development and QA.

## Metric Tiles
- **Inputs:** Metric value, change percentage, trend data, threshold configuration.
- **Behaviour:** Display numeric value with prefix/suffix, apply colour coding based on thresholds, animate value changes, open detail modal on click.
- **States:** Loading skeleton, error (display fallback message), empty (show placeholder copy).
- **Events:** `metric_tile_clicked`, `metric_tile_hovered`, `metric_tile_threshold_alert`.

## Data Cards
- **Inputs:** Entity data (gig/provider/task), status, tags, actions list.
- **Behaviour:** Render primary info, secondary metadata, quick actions; support expandable section for additional details.
- **States:** Default, selected, disabled, alert (display warning icon and highlight).
- **Events:** `card_action_triggered`, `card_expand_toggle`, `card_saved`.

## Tables & Lists
- **Inputs:** Data array, column definitions, filters, sort state, pagination config.
- **Behaviour:** Render rows with zebra striping, support inline edit, multi-select; persistent column preferences stored per user.
- **States:** Loading (skeleton rows), empty (illustration + CTA), error (retry button).
- **Events:** `table_sort_changed`, `table_filter_applied`, `row_selected`, `bulk_action_performed`.

## Form Components
- **Text Fields:** Validate on blur, show helper text, support masks (currency, phone). Emit `field_updated`, `field_error` events.
- **Dropdowns/Multi-select:** Searchable, keyboard navigable, display selected chips; emit `option_selected`, `option_removed`.
- **File Upload:** Accept drag/drop, camera capture, or file picker; progress bar with cancel option; emit `file_uploaded`, `file_failed`.
- **Date/Time Picker:** Provide preset ranges, timezone awareness, inline validation; emit `date_selected`.

## Navigation Widgets
- **Tabs/Stepper:** Manage active state, update URL hash, handle keyboard navigation; emit `tab_changed`, `step_completed`.
- **Breadcrumbs:** Provide history path; clicking emits `breadcrumb_navigate` with target route.
- **Side Nav:** Collapsible sections, track last open state, highlight active route.

## Feedback Widgets
- **Toasts:** Queue messages, auto-dismiss after duration, pause on hover; emit `toast_dismissed`.
- **Alert Banners:** Persistent until dismissed; optionally block actions; emit `alert_dismissed`, `alert_action_clicked`.
- **Badges:** Show counts, provide `aria-live` updates for assistive tech.

## Supportive Widgets
- **Tooltips:** Delay display, align based on viewport, ensure accessible focus; emit `tooltip_opened`.
- **Help Drawer:** Fetch contextual content, allow feedback submission; emit `help_article_viewed`, `help_feedback_submitted`.
- **Coach Marks:** Step-based onboarding overlay with progress tracker and skip option.

## State Management Guidance
- Widgets consume data from central store (Redux/MobX) or React Query caches; avoid duplicated state.
- Error states propagate to global error handler for logging.
- Provide loading fallback for asynchronous interactions to maintain perceived performance.

## QA Considerations
- Verify widgets respond correctly to keyboard and touch inputs.
- Test data permutations (long text, zero values, max values).
- Confirm analytics events fire with accurate payloads.
- Ensure theming tokens apply correctly for light/dark variants.
