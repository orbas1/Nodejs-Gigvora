import { EventEmitter } from 'node:events';

export const MESSAGING_EVENTS = Object.freeze({
  MESSAGE_APPENDED: 'messaging:thread:message-appended',
  MESSAGES_PURGED: 'messaging:thread:messages-purged',
});

const emitter = new EventEmitter();
emitter.setMaxListeners(50);

export default emitter;

