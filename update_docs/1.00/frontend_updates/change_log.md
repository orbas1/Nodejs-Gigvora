# Front-End Change Log – Communication & Engagement Suite

## Messaging
- Introduced `messagingClient.js` with authenticated REST helpers (threads, messages, escalation, assignments, mute) and shared error handling.
- Added `useMessagingCenter` hook coordinating inbox polling, optimistic message sends, analytics events, and error recovery states.
- Delivered `ChatBubble.jsx`, a floating messaging surface featuring inbox preview, search, composer modal, support shortcut, and adaptive layout for mobile vs. desktop.
- Updated `MainLayout.jsx` to mount the chat bubble globally with theme-aware positioning and portal-based rendering to avoid stacking conflicts.

## Feed Experience
- Built `feedClient.js` for REST interactions (feed listing, post detail, reactions, comments, shares, moderation) with viewer state reconciliation.
- Overhauled `FeedPage.jsx` to support optimistic reactions, inline comment drawer, share composer, pagination, analytics instrumentation, and error recovery.
- Extended `apiClient.js` to expose token detection for viewer state hydration and to propagate auth headers to new clients.

## Analytics & Instrumentation
- Each major interaction now emits analytics events (`web_feed_viewed`, `web_feed_reaction_click`, `web_feed_comment_created`, `web_feed_share_submit`, `web_messaging_thread_opened`, `web_messaging_message_sent`, etc.) with metadata for cache hits and viewer state.
- Added graceful degradation for unauthenticated users, surfacing sign-in prompts when actions require authentication while still showing cached feed content.

## Trust & Compliance Dashboard
- Added `trust.js` service to call escrow/dispute APIs with cache-aware utilities reused by the Trust Center.
- Introduced `TrustCenter.jsx`, a blue-branded operations dashboard visualising escrow totals, release queues, dispute workloads, and Cloudflare R2 evidence health.
- Updated `Header.jsx` navigation and `App.jsx` routes to expose the Trust Center for finance/compliance teams with direct release actions invoking the new backend endpoints.
