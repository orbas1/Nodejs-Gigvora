# Serviceman Profile Changes

## Purpose
- Recognise field excellence and provide clear pathways for skill development.
- Synchronise availability with scheduling tools to reduce assignment conflicts.
- Maintain privacy for sensitive deployment history.

## Updates
1. **Performance Scorecards**
   - Monthly SLA adherence, customer satisfaction, and incident-free streaks visualised.
   - Supervisor commentary feed with ability to attach kudos or coaching tips.
2. **Skill Endorsements**
   - Colleagues and supervisors can endorse specific competencies with optional proof (photo, document).
   - Endorsements expire after 12 months unless renewed, ensuring accuracy.
3. **Availability Scheduler**
   - Drag-and-drop calendar synced to ICS feed; supports recurring patterns and blackout dates.
   - Conflict detector warns when overlapping commitments occur; suggests alternative slots.
4. **Privacy Controls**
   - Servicemen can redact specific deployments when sharing profiles externally.
   - Export to PDF respects privacy flags and includes watermarked release ID.

## Data Integrity & Security
- All profile updates captured in append-only audit log with reason codes.
- Availability updates require `serviceman:schedule.manage` scope and pass concurrency checks.
- Profile export requests rate limited to 10/hour per user, logged to security analytics.
