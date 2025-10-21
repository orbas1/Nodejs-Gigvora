# Widget Library Updates – User App v1.0.0

## GigvoraScaffold
- Centralised layout now exposes app bar, optional drawer, navigation destinations, and floating action buttons in a single Riverpod-aware widget.
- Padding respects spacing tokens delivered by `designTokensProvider`, ensuring cross-platform consistency.
- Embeds `LanguageMenuButton` by default so localization is always available from the top bar.

## Navigation System
- `GigvoraNavigationDestination` abstracts icon, selected icon, label, and route metadata, simplifying creation of bottom navigation bars across screens.
- Drawer experience handled by `GigvoraAppDrawer`, which renders session context, workspace shortcuts, and support links after reading `sessionControllerProvider`.

## Card & Banner Components
- `GigvoraCard` now draws elevation, surface colours, and rounded corners from the design system, used across calendar empty states, finance alerts, and explorer promotions.
- Status banners introduced in feed and calendar leverage shared colour palettes and iconography, improving accessibility compliance.

## Form & Editor Widgets
- Feed composer bottom sheet reuses modular editor components to handle text, link, and attachment workflows with optimistic state updates.
- Calendar editor modal exposes date pickers, timezone awareness, and completion toggles, mirroring the admin scheduling toolkit.

## Accessibility & Theming
- All reusable widgets declare semantics for assistive technologies and respect dynamic color schemes (light/dark) provided through the design system package.
- Widgets gracefully animate layout transitions while keeping motion reduced for users who disable animations at the OS level.

## Testing
- Widget suites validate Gigvora design components, ensuring drawer navigation, scaffold actions, and cards render consistently across screen sizes.
- Integration boot sequence (`integration_test/app_launch_test.dart`) overrides providers to confirm scaffolds, drawers, and localization controls appear before theme hydration completes.
