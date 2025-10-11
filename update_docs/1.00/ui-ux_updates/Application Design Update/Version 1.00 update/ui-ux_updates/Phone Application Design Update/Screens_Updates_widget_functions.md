# Widget Functional Specifications – Phone Application v1.00

## `GigvoraCard`
- **Props:** `title`, `subtitle`, `avatarUrl`, `badgeList`, `ctaLabel`, `ctaIcon`, `onTap`, `onCtaTap`, `state` (`default`, `loading`, `error`).
- **Behaviour:** Elevates to 8dp on press (scale 1.02), supports skeleton variant when `state == loading`, and inline error ribbon when `state == error`.
- **Accessibility:** Entire card accessible label concatenates title + organisation + meta chips.

## `GradientHero`
- **Props:** `backgroundGradient`, `backgroundImage`, `headline`, `subheadline`, `primaryAction`, `secondaryAction`, `chips`.
- **Behaviour:** Parallax scroll effect (offset 0.3x), CTA chips animate in sequence (delay 80ms) on load.

## `FilterChipRow`
- **Props:** `items` (label, value, icon), `selected`, `onSelected`, `multiSelect` flag.
- **Behaviour:** Scrollable with snap alignment; triggers analytics event `filter_select`.

## `SegmentedTabBar`
- **Props:** `tabs` (label, icon), `controller`, `onChanged`.
- **Behaviour:** Animated pill slider (duration 160ms); integrates with `TabController` for content sync.

## `OfflineBanner`
- **Props:** `status` (`offline`, `error`, `warning`), `message`, `ctaLabel`, `onCta`, `icon`.
- **Behaviour:** Slides down from top; persistent until connectivity restored or dismissed.

## `AnalyticsPill`
- **Props:** `icon`, `label`, `value`, `tone`.
- **Behaviour:** Pulses subtly (opacity 0.9→1) when value updates; accessible label describes measurement.

## `ProgressStepper`
- **Props:** `steps`, `currentIndex`, `onStepTapped`.
- **Behaviour:** Dots enlarge for active step; optional tooltip for each stage.

## `TimelineItem`
- **Props:** `title`, `subtitle`, `timestamp`, `status`, `cta`, `icon`.
- **Behaviour:** Vertical line extends using `AnimatedContainer`; CTA supports swipe gestures.

## `MessageBubble`
- **Props:** `text`, `timestamp`, `sender`, `status`, `attachments`.
- **Behaviour:** Supports markdown subset, long press opens contextual menu (copy, delete, react).

## `CTAButton`
- **Props:** `label`, `icon`, `variant` (`primary`, `secondary`, `outline`, `ghost`), `loading`, `onPressed`.
- **Behaviour:** Loading state replaces label with spinner; disabled state lowers opacity to 0.48.

## `DataChip`
- **Props:** `label`, `icon`, `tone`.
- **Behaviour:** Auto-shrinks text using `FittedBox` for long labels, accessible role `status`.

## `SkeletonCard`
- **Props:** `layoutType` (feed, opportunity, notification).
- **Behaviour:** Shimmer gradient moving left→right every 1100ms.

## `IllustratedEmptyState`
- **Props:** `illustration`, `title`, `body`, `primaryCta`, `secondaryCta`.
- **Behaviour:** Illustration floats with 6dp vertical oscillation; optional background gradient toggle.

## `SettingsToggleRow`
- **Props:** `title`, `description`, `value`, `onChanged`, `icon`.
- **Behaviour:** Switch uses Material 3 dynamic colors; entire row accessible as single toggle.

## `SupportCard`
- **Props:** `title`, `description`, `ctaLabel`, `ctaIcon`, `contactMethod`.
- **Behaviour:** On tap, triggers respective contact flow (email, chat, phone) with analytics event `support_contact`.
- **States:** `default`, `busy` (shows inline spinner while chat loads), `disabled` (greyed out when channel offline).

## `ExportStatusTile`
- **Props:** `jobName`, `createdAt`, `status` (`queued`, `processing`, `ready`, `failed`), `downloadUrl`, `onTap`, `onRetry`.
- **Behaviour:** Displays progress bar (height 6dp) for `processing`, check icon for `ready`. `failed` state shows inline error text and retry button following outline spec.
- **Accessibility:** Announces status changes via `SemanticsService.announce` for screen readers.

## `NpsSurvey`
- **Props:** `onSubmit(score, comment)`, `onSkip`, `copy`, `defaultScore`.
- **Behaviour:** Rating chips animate scale-in sequentially (80ms stagger). Submit disabled until rating selected; comment optional but auto-expands to max 5 lines.
- **Validation:** If comment included, enforce ≥10 characters to gather meaningful feedback; show inline helper when not met.

## `QuickActionRadial`
- **Props:** `actions[]` (icon, label, onTap), `anchorOffset`, `radius` (default 88dp).
- **Behaviour:** Long-press reveals radial menu with actions placed at equal angles. Menu closes on selection or tap outside. Provides haptic feedback on open and selection.
- **Safety:** Do not expose destructive actions; emphasise primary action by placing at 12 o'clock position with accent gradient bubble.

## `HeroMetric`
- **Props:** `value`, `unit`, `label`, `trend` (`up`, `down`, `flat`), `contextIcon`.
- **Behaviour:** Animates numeric change using `TweenAnimationBuilder`; trend arrow color-coded (up `#16A34A`, down `#DC2626`, flat `#94A3B8`).
- **Layout:** Value set in Inter 32/40 bold, label 14/20 medium, unit baseline-aligned using `Baseline` widget.
