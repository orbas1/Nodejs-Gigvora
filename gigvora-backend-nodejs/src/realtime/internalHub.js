import EventEmitter from 'node:events';

const internalHub = new EventEmitter();
internalHub.setMaxListeners(50);

let bootstrapped = false;

export async function bootstrapInternalRealtimeHub({ logger } = {}) {
  if (bootstrapped) {
    return internalHub;
  }
  bootstrapped = true;
  if (logger?.info) {
    logger.info('Internal realtime hub primed');
  }
  return internalHub;
}

export function getInternalRealtimeHub() {
  return internalHub;
}

export default {
  bootstrapInternalRealtimeHub,
  getInternalRealtimeHub,
};
