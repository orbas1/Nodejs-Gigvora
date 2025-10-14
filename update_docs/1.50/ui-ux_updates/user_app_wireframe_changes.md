# User Mobile Application Wireframe Changes — Version 1.50

## Research Summary
- Conducted 24 moderated usability sessions with active consumers testing discovery, booking, and messaging flows.
- Analysed clickstream data from 480k sessions to identify drop-off points in gig creation and profile editing.
- Synthesised insights into opportunity map prioritising clarity, personalisation, and trust.

## Navigation Framework
- **Bottom Navigation:** Expanded to five tabs (Discover, Saved, Messages, Bookings, Profile) with central floating action button for quick gig posting.
- **Global Search:** Persistent search pill at top of Discover screen transitions into full-screen search with category chips and history.
- **Contextual Header:** Adaptive header reveals location picker, filter summary, and notification icon when user scrolls upward.

## Discover & Feed Wireframes
1. **Hero Spotlight**
   - Rotating highlight card featuring top-rated services, with overlay CTA and dynamic background gradient.
   - Includes carousel dots, skip option, and accessibility-compliant alt text.
2. **Personalised Sections**
   - Segmented feed blocks (For You, Trending Nearby, Returning Pros, Gigvora Picks) each with horizontal scroll and "See All" link.
   - Cards show hero image, provider avatar, rating, distance, price range, and quick actions (save, share).
3. **Filter Drawer**
   - Swipe-up drawer containing toggles for availability, price slider, skills, certifications, and languages.
   - Live results count updates as filters applied; includes "Reset" and "Apply" CTA bar.
4. **Empty State**
   - Illustrations with friendly copy encouraging user to broaden filters or post custom gig.

## Gig Detail Screen Wireframes
- **Hero Media:** Auto-playing muted video preview with overlay rating badge, favourite toggle, and share icon.
- **Summary Module:** Provider name, badges (Verified, Insured), response time, price summary with discount indicator.
- **Tabs Layout:** Overview (description, bullet list of highlights), Reviews (list with filters, rating histogram), Availability (calendar + time slots), Packages (cards with features and add-ons).
- **Upsell CTA:** Sticky bottom bar offering "Chat Now" or "Book" with dynamic price details.
- **Recommendations:** Scrollable related gigs module with context chips (similar to what you viewed, trending in your area).

## Gig Creation Wizard Wireframes
1. **Step 1 — Basics**
   - Form fields for gig type, location, date/time, budget slider; inline helper text and autofill suggestions from previous gigs.
   - Progress indicator at top showing 4 steps with completion status.
2. **Step 2 — Details**
   - Text area for description, checklist toggles for equipment, skill requirements, and attachments uploader.
   - Real-time summary card on right (or bottom on mobile) updating with user inputs.
3. **Step 3 — Preferences**
   - Options to select preferred providers, add vetting questions, and set communication preferences.
   - Visual preview of request message to providers.
4. **Step 4 — Review & Publish**
   - Recap page with editable sections, policy acknowledgement checkbox, and publish confirmation.
   - Success screen with confetti animation, share options, and guidance on next steps.

## Messaging Wireframes
- **Thread List:** Tab bar toggling between All, Unread, Archived; each thread shows avatar stack, last message snippet, timestamp, and status chips (Awaiting Response, Confirmed).
- **Conversation View:** Chat bubbles, inline attachments (images, documents), quick reply suggestions, and action bar for deposit requests or booking confirmation.
- **Callouts:** System messages for booking updates, payment reminders, and safety tips appear as inline cards.
- **Context Drawer:** Swipe from right to reveal gig summary, shared files, and upcoming milestones.

## Bookings & Schedule Wireframes
- **Bookings Overview:** Calendar view with tabs for Upcoming, Past, Cancelled; cards display gig name, provider, status, and actions (message, reschedule, cancel).
- **Booking Detail:** Timeline of key events, checklist for preparation, map embed with navigation link, and receipt summary.
- **Reschedule Flow:** Stepper for selecting new time slot, provider confirmation, and update summary.

## Commerce & Membership Wireframes
- **Purchase & Subscription Hub:** Card stack showcasing available plans, benefits, and trial countdown; includes CTA for upgrade, manage billing, and view invoices.
- **Finance Settings:** Accordion layout for payment methods, payout preferences for freelancers, and tax documentation upload with progress states.
- **Budget Overview:** Visual tracker for personal spending against set goals; includes alerts when approaching thresholds and suggestions for optimising bookings.
- **Account Preferences:** Tabbed screens for privacy, notification tiers, accessibility options, and experimental features with inline explanations.

## Career & Opportunity Wireframes
- **Job Listing Explorer:** Search-first layout with filter chips (role, location, salary, remote), card list showing employer info, status badges, and quick apply CTA.
- **Interview Management:** Dashboard summarising scheduled interviews, preparation tasks, and decision status; integrates countdown timers and quick access to interview room links.
- **Interview Room:** Mobile-friendly video layout with collapsible notes panel, shared documents carousel, and rating submission after session.
- **Experience Launchpad:** Guided roadmap for launching services or side projects with progress tracker, mentor recommendations, and resource library.
- **Project Management View:** Mobile-adapted kanban board with swipe gestures, card expansion for task details, and quick assign functionality.
- **Gig Management:** List of gigs the user offers with status tags, analytics snapshot, and shortcuts to pause or boost visibility.
- **Mentorship Panel:** Dual view for mentor/mentee roles featuring session scheduling, goal tracking, and feedback collection forms.
- **Volunteering Hub:** Map + list hybrid showing volunteering opportunities with filters for cause, duration, and skill fit; quick apply sheet includes availability selection.

## Community & Engagement Wireframes
- **Networking Lounge:** Live event cards with countdown timers, join buttons, and attendee previews; includes schedule tab for upcoming speed networking rounds.
- **Creation Studio:** Template gallery for portfolios, service previews, and marketing assets; editing mode supports drag-and-drop modules and preview toggles for mobile/desktop.
- **Messaging Extensions:** Chat bubble overlay accessible from any screen showing quick replies, pinned threads, and voice note support.
- **Inbox:** Unified inbox merging bookings, opportunities, and community messages with filtering for unread, actionable, and archived categories.

## Static & Informational Pages
- **Profile Page:** Extended layout with hero, journey timeline, testimonials, metrics, and share profile CTA.
- **About Us, Terms, Privacy:** Responsive scroll experiences with sticky table of contents, inline anchors, and callouts summarising key policies; includes quick contact CTA.

## Profile & Trust Wireframes
- **Profile Home:** User avatar, verification badge, rating, quick stats (completed gigs, repeat providers, credits).
- **Personal Info Section:** Expandable cards for contact details, payment methods, addresses with inline edit icons.
- **Preferences:** Notification toggles, language selection, accessibility options (text size, contrast mode).
- **Trust Center:** List of verifications with status, ability to add ID, and access to safety resources.
- **Achievements:** Gamified badges for milestones with shareable social cards.

## Support & Help Wireframes
- **Help Hub:** Search bar, top FAQs, categories (Bookings, Payments, Safety), and CTA to contact support.
- **Support Chat:** Conversational UI with suggested prompts, knowledge base article cards, and escalate to human option.
- **Report Issue Flow:** Multi-step form capturing gig details, issue type, attachments, and resolution preference.

## Onboarding & Education
- New user onboarding checklist accessible from Profile with progress tracker.
- In-context tooltips highlight new features after updates.
- Video tutorials accessible from Discover and Profile sections.

## Responsive & Accessibility Considerations
- Landscape orientation supports two-column layout for tablets.
- All tappable elements maintain 48px height with generous spacing.
- Added high-contrast theme preview toggle in settings for visual assurance.

## Testing & Validation
- Maze prototypes tested with 120 participants; metrics showed 32% faster booking flow completion.
- VoiceOver and TalkBack audits ensured read order and labels meet accessibility standards.
- Analytics instrumentation planned for each wizard step to monitor drop-offs.

## Next Iterations
- Explore AI-generated gig briefs using historical data.
- Add collaborative booking for multi-user households.
- Investigate offline mode for low-connectivity regions.
