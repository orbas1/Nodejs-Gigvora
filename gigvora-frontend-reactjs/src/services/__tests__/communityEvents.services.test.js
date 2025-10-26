import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../apiClient.js', () => {
  const mock = {
    get: vi.fn(() => Promise.resolve({ data: {} })),
  };
  return {
    apiClient: mock,
    default: mock,
  };
});

import apiClient, { apiClient as namedApiClient } from '../apiClient.js';
import {
  fetchCommunityCalendar,
  fetchCommunityEvent,
  fetchVolunteerRoster,
} from '../communityEvents.js';

describe('community events services', () => {
  beforeEach(() => {
    apiClient.get.mockClear();
    namedApiClient.get.mockClear();
  });

  it('fetchCommunityCalendar forwards params to /community/events', async () => {
    const params = { limit: 20, focus: 'mentorship' };
    await fetchCommunityCalendar(params, { signal: 'controller' });
    expect(apiClient.get).toHaveBeenCalledWith('/community/events', {
      params,
      signal: 'controller',
    });
  });

  it('fetchCommunityEvent requires eventId', async () => {
    await expect(fetchCommunityEvent()).rejects.toThrow('eventId is required to load the community event.');
  });

  it('fetchCommunityEvent requests event detail with optional timezone', async () => {
    await fetchCommunityEvent(42, { timezone: 'UTC', signal: 'controller' });
    expect(apiClient.get).toHaveBeenCalledWith('/community/events/42', {
      params: { timezone: 'UTC' },
      signal: 'controller',
    });
  });

  it('fetchVolunteerRoster hits /community/volunteers', async () => {
    const params = { limit: 15, availability: 'ready_now' };
    await fetchVolunteerRoster(params, { signal: 'controller' });
    expect(apiClient.get).toHaveBeenCalledWith('/community/volunteers', {
      params,
      signal: 'controller',
    });
  });
});
