# Widget Types Inventory — Application Screen Updates

## Purpose
Catalogue the interactive and informational widgets used across redesigned screens to ensure reuse, consistency, and engineering clarity.

## Core Widget Categories
1. **Metric Tiles**
   - Variants: KPI Tile, Trend Tile, Segmented KPI (with stacked metrics).
   - States: Default, Loading Skeleton, Alert (warning/error), Disabled.
   - Behaviours: Tooltip on hover/tap, click to open detail drawer.
2. **Data Cards**
   - Variants: Gig Summary Card, Provider Profile Card, Task Card.
   - Embedded Elements: Status chip, avatars, quick action buttons, metadata rows.
3. **Lists & Tables**
   - Variants: Standard table, compact table, responsive card list, virtualised infinite list.
   - Features: Column sorting, filtering chips, inline edit, row selection.
4. **Forms & Inputs**
   - Components: Text fields, dropdowns, multi-select chips, file upload, date/time pickers, toggle switches, slider controls.
   - Accessibility: Label + helper text, error messaging, focus outlines.
5. **Navigation Widgets**
   - Elements: Top tabs, side rail navigation, breadcrumbs, stepper, segmented controls.
   - Behaviour: Maintain state, deep linking, keyboard navigation.
6. **Feedback & Alert Widgets**
   - Toast notifications, inline alert banners, badge counters, progress indicators.
7. **Supportive Widgets**
   - Tooltips, info modals, onboarding coach marks, contextual help drawers.

## Widget Mapping by Screen
| Screen | Widget Types |
|--------|--------------|
| Provider Dashboard | Metric Tiles, Data Cards, Alert Banner, Tabs |
| Queue Management | Table, Detail Drawer, Bulk Action Toolbar, Filters |
| Gig Creation | Form Inputs, Stepper, File Upload, Summary Card |
| Messaging | Conversation List, Message Bubble, Quick Reply Chips, Context Drawer |
| Settings Hub | Tabs, Forms, Confirmation Modal, Audit Log Table |

## Widget Governance
- All widgets sourced from central component library with naming conventions (`Widget/MetricTile`, `Widget/Form/TextField`).
- Properties documented (e.g., `props.variant`, `props.state`, `props.icon`).
- Interaction guidelines define hover/focus/press behaviours and motion.
- Accessibility notes specify ARIA roles, keyboard support, and alt text requirements.

## Extension Roadmap
- Introduce analytics widget with comparative charts and scenario simulation.
- Develop automation rule builder widget with drag-and-drop logic blocks.
- Add collaborative checklist widget enabling multi-user assignment.
