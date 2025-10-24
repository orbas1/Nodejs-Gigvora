const snapshots = new Map();

function sanitizeSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    return null;
  }
  return {
    ...snapshot,
    generatedAt: snapshot.generatedAt ?? new Date().toISOString(),
  };
}

export function updateQueueSnapshot(name, snapshot) {
  if (!name) {
    throw new Error('Queue name is required when caching a snapshot.');
  }
  const sanitized = sanitizeSnapshot(snapshot);
  if (!sanitized) {
    return;
  }
  snapshots.set(name, sanitized);
}

export function getQueueSnapshot(name) {
  return snapshots.get(name) ?? null;
}

export function resetQueueSnapshots() {
  snapshots.clear();
}

export default {
  updateQueueSnapshot,
  getQueueSnapshot,
  resetQueueSnapshots,
};
