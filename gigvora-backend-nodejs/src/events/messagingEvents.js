import { EventEmitter } from 'node:events';

export const MESSAGING_EVENTS = Object.freeze({
  MESSAGE_APPENDED: 'messaging:thread:message-appended',
  MESSAGES_PURGED: 'messaging:thread:messages-purged',
  RETENTION_AUDIT_RECORDED: 'messaging:retention:audit-recorded',
});

const emitter = new EventEmitter();
emitter.setMaxListeners(50);

export default emitter;

