import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  configureRateLimitMetrics,
  resetRateLimitMetrics,
  recordRateLimitAttempt,
  recordRateLimitSuccess,
  recordRateLimitBlocked,
  getRateLimitSnapshot,
} from '../../src/observability/rateLimitMetrics.js';

describe('rateLimitMetrics', () => {
  beforeEach(() => {
    configureRateLimitMetrics({ windowMs: 1000, max: 5 });
  });

  it('tracks allowed and blocked requests per window', () => {
    const start = Date.now();
    for (let index = 0; index < 4; index += 1) {
      const timestamp = start + index * 5;
      recordRateLimitAttempt({ key: 'user:1', method: 'GET', path: '/api/example', timestamp });
      recordRateLimitSuccess({ key: 'user:1', timestamp });
    }

    const blockedTimestamp = start + 50;
    recordRateLimitAttempt({ key: 'user:1', method: 'GET', path: '/api/example', timestamp: blockedTimestamp });
    recordRateLimitBlocked({ key: 'user:1', method: 'GET', path: '/api/example', timestamp: blockedTimestamp });

    const snapshot = getRateLimitSnapshot(start + 100);
    expect(snapshot.currentWindow.hits).toBe(5);
    expect(snapshot.currentWindow.allowed).toBe(4);
    expect(snapshot.currentWindow.blocked).toBe(1);
    expect(snapshot.topConsumers[0]).toMatchObject({
      key: 'user:1',
      hits: 5,
      blocked: 1,
    });
    expect(snapshot.currentWindow.approachingLimit[0]).toMatchObject({ key: 'user:1' });
    expect(snapshot.lifetime).toMatchObject({ hits: 5, allowed: 4, blocked: 1 });
  });

  it('rolls windows into history when thresholds elapse', () => {
    const start = Date.now();
    recordRateLimitAttempt({ key: 'ip:1', method: 'GET', path: '/api/a', timestamp: start });
    recordRateLimitSuccess({ key: 'ip:1', timestamp: start });

    // Force a new window by simulating an attempt after the window duration.
    recordRateLimitAttempt({ key: 'ip:2', method: 'POST', path: '/api/b', timestamp: start + 1500 });
    recordRateLimitSuccess({ key: 'ip:2', timestamp: start + 1500 });

    const snapshot = getRateLimitSnapshot(start + 2000);
    expect(snapshot.history.length).toBeGreaterThan(0);
    expect(snapshot.history[0].hits).toBeGreaterThan(0);
    expect(snapshot.currentWindow.hits).toBe(1);
  });

  it('reset clears tracked keys and counters', () => {
    recordRateLimitAttempt({ key: 'user:2', method: 'GET', path: '/api/test' });
    recordRateLimitSuccess({ key: 'user:2' });
    let snapshot = getRateLimitSnapshot();
    expect(snapshot.currentWindow.hits).toBe(1);

    resetRateLimitMetrics();

    snapshot = getRateLimitSnapshot();
    expect(snapshot.currentWindow.hits).toBe(0);
    expect(snapshot.topConsumers).toHaveLength(0);
    expect(snapshot.lifetime.hits).toBe(0);
  });
});

