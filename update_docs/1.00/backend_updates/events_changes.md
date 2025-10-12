# Events & Logging Updates – Version 1.00

- Project assignment events now include `updated` payloads capturing field-level change history (title, status, budget, location, geo metadata) alongside the previous `updatedAt` timestamp for audit replay.
- New `auto_assign_queue_regenerated` event is emitted whenever queue recalculation occurs because of budget shifts, fairness tuning, or manual regeneration, enabling analytics to measure fairness adjustments over time.
- `auto_assign_enabled` now fires both on project creation and whenever the queue is re-enabled after a pause, ensuring assignment telemetry captures full toggle history.
