# Controller Changes

- **calendarController.js**
  - Added `surface` metadata to overview/event responses and normalised completion toggles.
  - Improved error messages when optimistic updates fail, ensuring clients receive actionable feedback.
- **explorerController.js**
  - Accepts optional `surface` query param and forwards it to `explorerStore` for channel-aware ranking.
  - Guarded against empty result sets by returning structured fallbacks consumed by mobile grids.
- **financeController.js**
  - Ensured ledger entries include currency, period, and precision fields for consistent mobile chart rendering.
  - Added caching headers aligned with finance SLA (30 seconds) to support offline-first clients.
- **authController.js**
  - Propagates device hints during refresh and login responses, enabling audit and analytics improvements.
