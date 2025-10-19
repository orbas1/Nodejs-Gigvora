import { performance } from 'node:perf_hooks';

function now() {
  return new Date();
}

function buildConnectionMetadata(socket) {
  return {
    socketId: socket.id,
    connectedAt: now().toISOString(),
    remoteAddress: socket.handshake?.address ?? null,
    userAgent: socket.handshake?.headers?.['user-agent'] ?? null,
  };
}

export function createConnectionRegistry({ maxConnectionsPerUser = 6, presenceStore, logger }) {
  const connectionsByUser = new Map();
  const sockets = new Map();

  async function publishPresence(userId) {
    if (!presenceStore) {
      return;
    }
    const activeSockets = connectionsByUser.get(userId) ?? [];
    const payload = activeSockets.map((entry) => ({
      socketId: entry.socket.id,
      connectedAt: entry.connectedAt,
      remoteAddress: entry.remoteAddress,
    }));
    await presenceStore.setUserPresence(userId, payload);
  }

  async function register(socket) {
    const actor = socket.data?.actor;
    const userId = actor?.id;
    if (!userId) {
      return;
    }

    const existing = connectionsByUser.get(userId) ?? [];
    if (existing.length >= maxConnectionsPerUser) {
      const [oldest] = existing.sort((a, b) => new Date(a.connectedAt) - new Date(b.connectedAt));
      if (oldest) {
        logger?.warn(
          {
            userId,
            socketId: socket.id,
            existingSockets: existing.map((entry) => entry.socket.id),
          },
          'Connection limit reached for user; disconnecting oldest socket.',
        );
        oldest.socket.emit('system:connection-limited', {
          message:
            'You were disconnected because a new session was started in another tab or device. Only active sessions are retained.',
        });
        oldest.socket.disconnect(true);
      }
    }

    const metadata = buildConnectionMetadata(socket);
    const entry = { socket, connectedAt: metadata.connectedAt, remoteAddress: metadata.remoteAddress };
    const updated = [...(connectionsByUser.get(userId) ?? []), entry];
    connectionsByUser.set(userId, updated);
    sockets.set(socket.id, { userId, metadata });

    if (presenceStore) {
      await presenceStore.trackJoin(userId, metadata);
    }
    await publishPresence(userId);
  }

  async function unregister(socket, reason = 'disconnect') {
    const mapping = sockets.get(socket.id);
    if (!mapping) {
      return;
    }
    sockets.delete(socket.id);
    const { userId } = mapping;
    const existing = connectionsByUser.get(userId) ?? [];
    const remaining = existing.filter((entry) => entry.socket.id !== socket.id);
    if (remaining.length === 0) {
      connectionsByUser.delete(userId);
    } else {
      connectionsByUser.set(userId, remaining);
    }
    if (presenceStore) {
      await presenceStore.trackLeave(userId, mapping.metadata, reason);
    }
    await publishPresence(userId);
  }

  function getActiveConnections(userId) {
    return (connectionsByUser.get(userId) ?? []).map((entry) => ({
      socketId: entry.socket.id,
      connectedAt: entry.connectedAt,
      remoteAddress: entry.remoteAddress,
    }));
  }

  function getConnectedUserCount() {
    return connectionsByUser.size;
  }

  function getActiveSocketCount() {
    return sockets.size;
  }

  function describe() {
    return {
      users: connectionsByUser.size,
      sockets: sockets.size,
      maxConnectionsPerUser,
      generatedAt: performance.now(),
    };
  }

  return {
    register,
    unregister,
    getActiveConnections,
    getConnectedUserCount,
    getActiveSocketCount,
    describe,
  };
}

export default createConnectionRegistry;
