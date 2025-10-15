# Widget & Screen Updates — User Phone App

## 10 Apr 2024
- **Runtime Maintenance Drawer:** New widget presenting severity badge, countdown timer, impacted services, and CTA stack. Supports dismissible states, offline fallback, and analytics hooks (`maintenance_drawer_impression`, `maintenance_drawer_cta`).
- **Home Banner:** Replaced static status chip with dynamic banner fed by maintenance API. Includes pill indicator for upcoming maintenance, taps open drawer, and automatically collapses post-resolution.
- **Security Dashboard Card:** Expanded to show runtime health summary, last maintenance timestamp, and quick link to admin support article.
- **Notifications:** Added push template for maintenance events with action buttons ("View details", "Snooze"), ensuring copy uses shared localisation tokens.
