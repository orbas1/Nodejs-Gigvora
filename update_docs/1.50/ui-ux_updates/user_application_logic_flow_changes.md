# User Mobile Application Logic & Flow Changes — Version 1.50

## Overview
We restructured the consumer app logic to emphasise clarity, personalised recommendations, and trust-building. Critical flows now feature explicit milestones, contextual education, and automation hooks that reduce manual effort for both users and providers.

## Flow Principles
- **Predictable Pathways:** Each journey follows a linear or branched stepper with clear status indicators.
- **Personalisation:** Flow branches leverage user profile, location, and historical behaviour to tailor content.
- **Feedback Loops:** Success, error, and intermediate states provide immediate feedback with actionable next steps.
- **Safety & Compliance:** Safety prompts and verification steps integrated without breaking momentum.

## Core Flows
### 1. Discover → Gig Detail → Booking
1. **Discover Feed Entry**
   - Context-aware cards display recommended gigs with CTA. Selecting a card logs interest event and passes context to detail screen.
2. **Gig Detail Assessment**
   - Tabs load lazily to reduce initial payload; logic prefetches availability data when user scrolls beyond summary.
   - Safety banner displays if service flagged for special instructions or COVID-related policies.
3. **Booking Decision**
   - "Book" CTA triggers decision layer: new booking vs. recurring schedule. Flow checks for existing credits or promo codes.
   - Conflict detection ensures timeslot availability and prompts for alternatives if clash.
4. **Confirmation**
   - Booking summary displays with share option, add-to-calendar, and ability to request modifications.
   - System triggers notifications (push, email) and updates provider dashboard.

### 2. Gig Creation Wizard
1. **Initialization**
   - Entry points include FAB, empty state prompts, or voice assistant integration. Flow preloads user defaults (address, payment).
2. **Data Capture**
   - Each step validates data on blur, surfaces inline hints, and stores partial progress for resume within 7 days.
   - Branching for gig type: recurring gigs show schedule builder; one-time gigs skip to details.
3. **Provider Matching**
   - After submission, algorithm queues matching providers and surfaces ETA for responses.
   - Users can boost request visibility via upsell, with inline explanation of benefits.
4. **Post-Publish Management**
   - Users monitor responses via Messages; logic pushes top matches to pinned section.
   - Cancellation flow accessible with policy summary and potential fees.

### 3. Messaging & Negotiation
- **Thread Initiation:** When a provider responds, flow checks if introduction message exists; if not, prompts user with template suggestions.
- **Negotiation Controls:** Quick actions for sharing photos, updating requirements, or confirming pricing; compliance logic ensures payment discussions remain within guidelines.
- **Commitment Layer:** When both parties agree, flow transitions to booking creation with pre-filled details and deposit prompts.
- **Escalation:** Safety keywords trigger automated assistant offering resources or escalation to support.

### 4. Payments & Checkout
- **Payment Selection:** Flow pulls saved payment methods, allows adding new card or wallet, and presents promo code entry.
- **Security Checks:** 3D Secure prompts handled in-app with fallback to web view if provider requires bank verification.
- **Receipt Delivery:** After payment, digital receipt stored in Booking detail; notifications sent to email.
- **Refund & Dispute Flow:** Allows user to initiate dispute; branch collects reason, evidence, and schedules support follow-up.

### 5. Profile Management
- **Profile Completion:** Flow guides users through adding photo, bio, preferences, and verification documents; progress meter encourages completion.
- **Notification Settings:** Tabbed interface to manage push, email, SMS; includes preview of message types.
- **Safety Settings:** Users can share emergency contact, enable location sharing for active bookings, and manage blocked providers.

## Automation Touchpoints
- Event taxonomy updated to track entry, exit, and outcomes for each flow.
- Push notification cadence refined to avoid fatigue (max 3/day) with quiet hours respect.
- In-app tips triggered by milestone completions (e.g., first review posted).

## Accessibility Logic
- Dynamic text scaling supported up to 150% with layout adjustments to avoid truncation.
- VoiceOver/TalkBack labels updated for all interactive elements; rotor actions configured for quick navigation between sections.
- Error announcements use polite live regions with descriptive instructions.

## Analytics & Monitoring
- Funnels instrumented for Discover→Book, Create Gig, and Message→Booking conversions.
- Real-time dashboards monitor drop-offs, average completion time, and bounce rates by segment.
- Alerts configured for abnormal error rates or payment failures to trigger incident response.

## Testing & Validation
- Conducted cognitive walkthrough with accessibility consultants, refining focus order and narration.
- Beta release to 5k power users measured +14% increase in bookings and -22% drop in abandoned gig creation flows.
- Synthetic monitoring scripts ensure key API dependencies respond within thresholds.

## Future Enhancements
- Integrate AI-powered summarisation in messaging to surface key negotiation points.
- Expand loyalty rewards flow with tiered benefits and progress tracking.
- Explore contextual nudges encouraging reviews post-completion while respecting user fatigue.
