import { ValidationError } from '../utils/errors.js';

const providers = new Map();

function normaliseProviderKey(provider) {
  if (!provider || !`${provider}`.trim()) {
    throw new ValidationError('provider is required.');
  }
  return `${provider}`.trim().toLowerCase();
}

export function registerCalendarProvider(provider, adapter) {
  const key = normaliseProviderKey(provider);
  if (!adapter || typeof adapter !== 'object') {
    throw new ValidationError('adapter must be an object.');
  }

  const resolved = {
    syncEvent:
      typeof adapter.syncEvent === 'function'
        ? adapter.syncEvent.bind(adapter)
        : async () => ({ metadata: { passthrough: true } }),
    deleteEvent:
      typeof adapter.deleteEvent === 'function'
        ? adapter.deleteEvent.bind(adapter)
        : async () => ({ status: 'ignored' }),
    fetchAvailability:
      typeof adapter.fetchAvailability === 'function'
        ? adapter.fetchAvailability.bind(adapter)
        : async () => ({ availability: [], metadata: {} }),
  };

  providers.set(key, resolved);
  return resolved;
}

export function unregisterCalendarProvider(provider) {
  const key = normaliseProviderKey(provider);
  providers.delete(key);
}

export function getCalendarProvider(provider) {
  if (!provider) {
    return null;
  }
  const key = `${provider}`.trim().toLowerCase();
  return providers.get(key) ?? null;
}

export function listCalendarProviders() {
  return Array.from(providers.keys());
}

if (!providers.has('manual')) {
  registerCalendarProvider('manual', {
    async syncEvent() {
      return { metadata: { provider: 'manual', mode: 'noop' } };
    },
    async deleteEvent() {
      return { status: 'noop' };
    },
    async fetchAvailability() {
      return { availability: [], metadata: { provider: 'manual' } };
    },
  });
}

export default {
  registerCalendarProvider,
  unregisterCalendarProvider,
  getCalendarProvider,
  listCalendarProviders,
};
