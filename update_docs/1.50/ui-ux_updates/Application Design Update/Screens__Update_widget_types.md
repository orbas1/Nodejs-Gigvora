# Widget Types Catalogue

## Structural Components
- **App Bars:**
  ```
  ComponentID: APP-BASE
  Slots: leadingIcon(C1), title(C2-C8), actionSlots(C9-C12)
  Variants: standard, contextual(filter tray), search(expands to C2-C12)
  Elevation: 2 default, 0 when scrolling past V10 (uses collapse animation 180ms)
  ```
- **Navigation:**
  ```
  ComponentID: NAV-TAB
  Structure: 5 tab buttons, central FAB notch, safe-area padding 12px
  Behaviour: preserves stack per tab; shows badge via `badgeCount` property
  ```
  - Floating action button hub (ID:FAB-CORE) attaches to NAV-TAB notch with spring animation (stiffness 260, damping 22).
  - Quick settings drawer (ID:DWR-QUICK) slides from right, width 312px, overlay opacity 0.4.
- **Cards:**
  ```
  ComponentID: CRD-GENERIC
  Layout: mediaSlot(C1-C12 optional), content(C1-C12), actionRow(C1-C12)
  Variants: metric, feed, volunteer, project summary, job listing, checklist
  Border Radius: 16px; Elevation states (rest:2, hover:4, pressed:6)
  ```

## Interactive Widgets
- **Buttons:**
  ```
  ComponentID: BTN-PRIMARY | BTN-SECONDARY | BTN-TERTIARY | BTN-DESTRUCTIVE
  Height: 52px (primary), 48px (others); Padding horizontal 20px
  States: default, hover (background tint +8), pressed (scale 0.98), disabled (opacity 0.48)
  ```
- **Chips:** Filter, status, and action chips with icon support; each chip exposes `state` (default, selected, disabled) and `affordance` (click, toggle, filter).
- **Stepper:** `STP-LINEAR` renders numbered steps with active bar; `STP-CIRCULAR` for progress loops. Both animate progress in 160ms ease-in-out.
- **Timeline:** `TIM-ESCROW` stages support inline CTA via `primaryAction` slot and colour-coded stage markers.
- **Modals & Sheets:**
  ```
  Modal: MOD-FULL (cover status bar, slide-up 280ms)
  Sheet: SHT-BOTTOM (corner radius 28px, drag handle height 4px)
  Dialog: DLG-CONFIRM (max width 420px, enters with scale/opacity animation)
  ```

## Data Entry Widgets
- **Form Inputs:** Each input exposes label, helper, error slots. `TXT-FLD` uses underline style for inline forms, `BOX-FLD` uses filled style for onboarding. Numeric steppers include min/max validation hooks and long-press repeat.
- **Media Uploaders:** `UPL-MEDIA` component handles queue management with chunked uploads (256KB). Shows progress ring overlay on thumbnails and retry chip on failure.
- **Rich Text Editor:** `RTE-POST` includes toolbar (bold, italic, bullet, link, attachment), mention suggestions panel anchored under caret, and preview state accessible through `mode="preview"`.

## Feedback & Status
- **Banners:** `BNR-INFO`, `BNR-WARN`, `BNR-SUCCESS` share 1:1 icon slot. Banners snap to top of viewport and support inline actions. Warning variant uses gradient from Amber500→Amber300.
- **Toasts:** `TST-GLOBAL` queue limited to 2 simultaneous messages; includes optional `undoLabel` property.
- **Skeletons:** Provide `variant` tokens (feed-card, list-row, profile-section). Each skeleton pulses with 1.5s shimmer animation.
- **Progress Indicators:** Circular loader `PRG-CIRC` uses 48px diameter; linear `PRG-LINE` anchors to bottom of cards (2px height) or forms (4px height).

## Analytics & Visualisation
- **Charts:** Backed by `CHT-SPARK`, `CHT-BAR`, `CHT-DONUT` components. Each consumes `dataSeries`, `comparisonSeries`, and `thresholds` props to standardise instrumentation.
- **Scorecards:** `SCR-TRUST` (dial with pointer + tooltip) and `SCR-LAUNCHPAD` (progress arc) share animation token `easeOutBack`. Provide `delta` slot for performance change callouts.
- **Badges:** `BDG-STATUS` supports severity palette (info, success, warning, danger) and `pulse` option for urgent states.
