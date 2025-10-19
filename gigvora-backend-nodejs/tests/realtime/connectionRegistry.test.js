import { describe, it, expect, jest } from '@jest/globals';
import { createConnectionRegistry } from '../../src/realtime/connectionRegistry.js';

describe('connectionRegistry', () => {
  it('tracks active sockets per user', async () => {
    const presenceEvents = [];
    const presenceStore = {
      async trackJoin(userId, metadata) {
        presenceEvents.push({ type: 'join', userId, metadata });
      },
      async trackLeave(userId, metadata, reason) {
        presenceEvents.push({ type: 'leave', userId, metadata, reason });
      },
      async setUserPresence() {
        return undefined;
      },
    };
    const registry = createConnectionRegistry({ maxConnectionsPerUser: 3, presenceStore });
    const socket = {
      id: 'socket-1',
      data: { actor: { id: 42 } },
      handshake: { address: '127.0.0.1', headers: { 'user-agent': 'jest' } },
      emit: jest.fn(),
      disconnect: jest.fn(),
    };

    await registry.register(socket);
    expect(registry.getActiveConnections(42)).toHaveLength(1);
    await registry.unregister(socket, 'test');
    expect(registry.getActiveConnections(42)).toHaveLength(0);
    expect(presenceEvents.filter((event) => event.type === 'join')).toHaveLength(1);
    expect(presenceEvents.filter((event) => event.type === 'leave')).toHaveLength(1);
  });

  it('disconnects the oldest socket when user reaches connection limit', async () => {
    const registry = createConnectionRegistry({ maxConnectionsPerUser: 1 });
    const firstSocket = {
      id: 'socket-first',
      data: { actor: { id: 7 } },
      handshake: { address: '10.0.0.1', headers: {} },
      emit: jest.fn(),
      disconnect: jest.fn(),
    };
    const secondSocket = {
      id: 'socket-second',
      data: { actor: { id: 7 } },
      handshake: { address: '10.0.0.2', headers: {} },
      emit: jest.fn(),
      disconnect: jest.fn(),
    };

    await registry.register(firstSocket);
    await registry.register(secondSocket);

    expect(firstSocket.disconnect).toHaveBeenCalledWith(true);
    expect(registry.getActiveConnections(7)).toHaveLength(2);

    await registry.unregister(firstSocket, 'limit');
    await registry.unregister(secondSocket, 'manual');
    expect(registry.getActiveConnections(7)).toHaveLength(0);
  });
});
