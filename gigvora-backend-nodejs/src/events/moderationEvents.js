import { EventEmitter } from 'node:events';

export const MODERATION_EVENT_TYPES = Object.freeze({
  EVENT_CREATED: 'moderation:event:created',
  EVENT_UPDATED: 'moderation:event:updated',
  QUEUE_REFRESH_REQUESTED: 'moderation:queue:refresh',
});

const moderationEvents = new EventEmitter();
moderationEvents.setMaxListeners(100);

export default moderationEvents;
