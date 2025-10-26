import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../apiClient.js', () => {
  const api = {
    get: vi.fn(),
    post: vi.fn(),
  };
  return {
    default: api,
  };
});

import apiClient from '../apiClient.js';
import {
  fetchLatestSystemStatus,
  acknowledgeSystemStatus,
  fetchFeedbackPulse,
  submitFeedbackPulse,
} from '../systemMessaging.js';

beforeEach(() => {
  apiClient.get.mockReset();
  apiClient.post.mockReset();
});

describe('systemMessaging service', () => {
  it('fetches the latest system status with query flags', async () => {
    apiClient.get.mockResolvedValue({ event: { eventKey: 'critical-outage' } });

    const event = await fetchLatestSystemStatus({ includeResolved: true, includeExpired: false, now: '2025-03-27T15:00:00Z' });

    expect(apiClient.get).toHaveBeenCalledWith('/system/status/latest', {
      params: {
        includeResolved: 'true',
        includeExpired: 'false',
        now: '2025-03-27T15:00:00Z',
      },
      signal: undefined,
    });
    expect(event.eventKey).toBe('critical-outage');
  });

  it('requires an event key when acknowledging status', async () => {
    await expect(acknowledgeSystemStatus('')).rejects.toThrow('eventKey is required.');
  });

  it('posts acknowledgement payload to the API', async () => {
    apiClient.post.mockResolvedValue({ acknowledgement: { userId: 7 } });

    const response = await acknowledgeSystemStatus('critical-outage', {
      channel: 'web',
      metadata: { acknowledgedFrom: 'toast' },
    });

    expect(apiClient.post).toHaveBeenCalledWith('/system/status/critical-outage/acknowledgements', {
      channel: 'web',
      metadata: { acknowledgedFrom: 'toast' },
    }, { signal: undefined });
    expect(response.acknowledgement.userId).toBe(7);
  });

  it('fetches feedback pulse definitions', async () => {
    apiClient.get.mockResolvedValue({ pulse: { pulseKey: 'executive-health' } });

    const pulse = await fetchFeedbackPulse('executive-health', { includeInactive: true });

    expect(apiClient.get).toHaveBeenCalledWith('/system/feedback-pulses/executive-health', {
      params: { includeInactive: 'true' },
      signal: undefined,
    });
    expect(pulse.pulseKey).toBe('executive-health');
  });

  it('requires a score to submit feedback', async () => {
    await expect(submitFeedbackPulse('executive-health', {})).rejects.toThrow('score is required to submit feedback.');
  });

  it('submits feedback pulse responses with optional fields', async () => {
    apiClient.post.mockResolvedValue({ response: { score: 4 } });

    const result = await submitFeedbackPulse(
      'executive-health',
      {
        score: 4,
        tags: ['roadmap clarity'],
        comment: 'Strong alignment.',
        channel: 'web',
      },
      { signal: 'abort-controller' },
    );

    expect(apiClient.post).toHaveBeenCalledWith(
      '/system/feedback-pulses/executive-health/responses',
      {
        score: 4,
        tags: ['roadmap clarity'],
        comment: 'Strong alignment.',
        channel: 'web',
      },
      { signal: 'abort-controller' },
    );
    expect(result.response.score).toBe(4);
  });
});
