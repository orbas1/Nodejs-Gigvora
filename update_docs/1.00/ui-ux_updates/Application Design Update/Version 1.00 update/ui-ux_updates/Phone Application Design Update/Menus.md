# Menu Structures – Phone Application v1.00

## Bottom Navigation
1. **Feed** – icon: `home-rounded`, label "Feed".
2. **Explorer** – icon: `search`, label "Explore".
3. **Marketplace** – icon: `briefcase`, label "Marketplace".
4. **Launchpad** – icon: `rocket`, label "Launchpad".
5. **Volunteering** – icon: `hand-heart`, label "Volunteer".
6. **Profile** – icon: `user-circle`, label "Profile".

- Active tab highlighted with accent underline and filled icon bubble `#DBEAFE`.
- Use `BottomNavigationBar` with `type: fixed`, support for safe area insets.

## Profile Overflow Menu
- "View profile as public"
- "Account settings"
- "Saved opportunities"
- "Switch to provider app" (if permission)
- "Log out"

## Contextual Menus
- **Feed Post:** `Save`, `Share`, `Mute author`, `Report`.
- **Opportunity Card:** `Save for later`, `Share`, `Copy link`, `Hide similar`.
- **Launchpad Milestone:** `Mark complete`, `Reschedule`, `View resources`.
- **Inbox Conversation:** `Pin`, `Mute`, `Archive`, `Report`.

## Drawer / Action Sheet
- For tablets, provide side drawer accessible from profile icon: replicates overflow menu + quick links (Support hub, Settings, Admin login).
- Action sheets use 16dp top corners, 60dp row height, icons 24dp left.

## Shortcuts & Gestures
- Long press on bottom nav icons to open quick actions (e.g., hold Launchpad → "Log milestone"). Display as radial menu with 3 options maximum.
- Swipe left on feed card reveals `Save` and `Hide` quick actions (background colours: `#2563EB` and `#F97316`).

## Accessibility
- Provide descriptive `tooltip` for each menu item (e.g., "Open Launchpad dashboard").
- Ensure voice commands map to menu items (Android Voice Access, iOS Voice Control).
- Maintain 48dp minimum height for action sheet items; add 12dp padding around icons for readability.

## New Menus & Quick Actions
- **Support Hub Menu:** Display actions `Start chat`, `Email support`, `Schedule call`. Use accent icons (chat bubble, envelope, calendar) with consistent 24dp size.
- **Data Export Context Menu:** Options `Download`, `Copy link`, `Delete job`. `Delete job` styled in warning colour `#DC2626`.
- **NPS Survey Overflow:** Provide `Remind me later`, `Never ask again` to respect user choice.
- **Radial Quick Actions:** Map to long-press on Launchpad nav—`Log milestone`, `View mentors`, `Open resources`. Keep wedge angle 60° and ensure actions don't obstruct other UI elements.
