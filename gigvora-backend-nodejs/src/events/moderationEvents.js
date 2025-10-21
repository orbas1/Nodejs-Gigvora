import { EventEmitter } from 'node:events';

export const MODERATION_EVENT_TYPES = Object.freeze({
  EVENT_CREATED: 'moderation:event:created',
  EVENT_UPDATED: 'moderation:event:updated',
  QUEUE_REFRESH_REQUESTED: 'moderation:queue:refresh',
  VOLUNTEERING_REVIEW_CREATED: 'moderation:volunteering:review:created',
  VOLUNTEERING_REVIEW_FLAGGED: 'moderation:volunteering:review:flagged',
  VOLUNTEERING_POST_ESCALATED: 'moderation:volunteering:post:escalated',
});

const moderationEvents = new EventEmitter();
moderationEvents.setMaxListeners(100);

export function emitModerationEvent(eventType, payload = {}) {
  moderationEvents.emit(eventType, { ...payload, emittedAt: new Date().toISOString() });
}

export function notifyVolunteeringReviewCreated(review) {
  emitModerationEvent(MODERATION_EVENT_TYPES.VOLUNTEERING_REVIEW_CREATED, { review });
}

export function notifyVolunteeringReviewFlagged(review, reason) {
  emitModerationEvent(MODERATION_EVENT_TYPES.VOLUNTEERING_REVIEW_FLAGGED, { review, reason });
}

export function notifyVolunteeringPostEscalated(post, metadata = {}) {
  emitModerationEvent(MODERATION_EVENT_TYPES.VOLUNTEERING_POST_ESCALATED, { post, metadata });
}

export default moderationEvents;
