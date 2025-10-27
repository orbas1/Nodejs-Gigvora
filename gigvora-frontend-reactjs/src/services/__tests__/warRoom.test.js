import { describe, expect, it, vi, beforeEach } from 'vitest';

import { fetchPlatformWarRoomSnapshot, fetchSecurityFabricSnapshot } from '../warRoom.js';
import apiClient from '../apiClient.js';

vi.mock('../apiClient.js', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

describe('warRoom services', () => {
  beforeEach(() => {
    apiClient.get.mockClear();
  });

  it('fetches the platform war room snapshot with optional params', async () => {
    await fetchPlatformWarRoomSnapshot({ windowMinutes: 45, signal: 'signal' });
    expect(apiClient.get).toHaveBeenCalledWith('/admin/war-room/platform-performance', {
      signal: 'signal',
      params: { windowMinutes: 45 },
    });
  });

  it('fetches the security fabric snapshot with optional params', async () => {
    await fetchSecurityFabricSnapshot({ limit: 15 });
    expect(apiClient.get).toHaveBeenCalledWith('/admin/war-room/security-fabric', {
      signal: undefined,
      params: { limit: 15 },
    });
  });
});
