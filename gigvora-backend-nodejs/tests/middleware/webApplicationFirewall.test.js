import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import createWebApplicationFirewall from '../../src/middleware/webApplicationFirewall.js';
import {
  configureWebApplicationFirewall,
  getWebApplicationFirewallSnapshot,
  resetWebApplicationFirewallMetrics,
} from '../../src/security/webApplicationFirewall.js';
import { getPerimeterSnapshot, resetPerimeterMetrics } from '../../src/observability/perimeterMetrics.js';

function createResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('webApplicationFirewall middleware', () => {
  beforeEach(() => {
    configureWebApplicationFirewall({ env: {} });
    resetWebApplicationFirewallMetrics();
    resetPerimeterMetrics();
  });

  it('allows clean requests to continue through the pipeline', async () => {
    const middleware = createWebApplicationFirewall({
      auditRecorder: jest.fn(),
    });
    const req = {
      method: 'GET',
      originalUrl: '/api/projects',
      headers: {},
      ip: '192.168.1.1',
    };
    const res = createResponse();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    const snapshot = getWebApplicationFirewallSnapshot();
    expect(snapshot.blockedRequests).toBe(0);
    const perimeter = getPerimeterSnapshot();
    expect(perimeter.totalBlocked).toBe(0);
  });

  it('blocks SQL injection attempts and records audit metadata', async () => {
    const auditRecorder = jest.fn().mockResolvedValue(undefined);
    const middleware = createWebApplicationFirewall({
      auditRecorder,
    });
    const req = {
      method: 'GET',
      originalUrl: "/api/users?email=admin@example.com' OR '1'='1",
      headers: {
        origin: 'https://attack.example',
        'user-agent': 'sqlmap/1.7.1',
      },
      ip: '203.0.113.10',
      get(header) {
        return this.headers?.[header.toLowerCase()];
      },
    };
    const res = createResponse();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Request blocked by security policy.',
        referenceId: expect.any(String),
      }),
    );
    expect(auditRecorder).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'security.perimeter.request_blocked',
        level: 'notice',
        metadata: expect.objectContaining({
          ip: '203.0.113.10',
          matchedRules: expect.arrayContaining([
            expect.objectContaining({ id: 'sql.boolean-operator' }),
            expect.objectContaining({ id: 'agent.blocked' }),
          ]),
        }),
      }),
      expect.any(Object),
    );

    const wafSnapshot = getWebApplicationFirewallSnapshot();
    expect(wafSnapshot.blockedRequests).toBe(1);
    expect(wafSnapshot.recentBlocks).toHaveLength(1);
    expect(wafSnapshot.blockedByRule.map((entry) => entry.ruleId)).toEqual(
      expect.arrayContaining(['sql.boolean-operator', 'agent.blocked']),
    );

    const perimeter = getPerimeterSnapshot();
    expect(perimeter.totalBlocked).toBe(1);
  });

  it('blocks requests from configured forbidden IP addresses', async () => {
    configureWebApplicationFirewall({ env: { WAF_BLOCKED_IPS: '10.0.0.5' } });
    resetWebApplicationFirewallMetrics();
    resetPerimeterMetrics();

    const auditRecorder = jest.fn().mockResolvedValue(undefined);
    const middleware = createWebApplicationFirewall({ auditRecorder });
    const req = {
      method: 'POST',
      originalUrl: '/api/auth/login',
      headers: {},
      ip: '10.0.0.5',
    };
    const res = createResponse();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(auditRecorder).toHaveBeenCalledWith(
      expect.objectContaining({ level: 'warn' }),
      expect.any(Object),
    );

    const snapshot = getWebApplicationFirewallSnapshot();
    expect(snapshot.blockedRequests).toBe(1);
    expect(snapshot.blockedIps[0]).toEqual({ ip: '10.0.0.5', count: 1 });
  });

  it('auto-blocks repeat offenders and escalates audit severity', async () => {
    configureWebApplicationFirewall({
      env: {
        WAF_AUTO_BLOCK_THRESHOLD: '2',
        WAF_AUTO_BLOCK_WINDOW_SECONDS: '120',
        WAF_AUTO_BLOCK_TTL_SECONDS: '600',
      },
    });
    resetWebApplicationFirewallMetrics();
    resetPerimeterMetrics();

    const auditRecorder = jest.fn().mockResolvedValue(undefined);
    const middleware = createWebApplicationFirewall({ auditRecorder });

    function buildRequest() {
      return {
        method: 'POST',
        originalUrl: "/api/auth/login?email=admin@example.com' OR '1'='1",
        headers: {
          origin: 'https://attack.example',
          'user-agent': 'sqlmap/1.7.1',
        },
        body: {
          email: "admin@example.com' OR '1'='1",
        },
        ip: '198.51.100.42',
        get(header) {
          return this.headers?.[header.toLowerCase()];
        },
      };
    }

    const res1 = createResponse();
    const next1 = jest.fn();
    await middleware(buildRequest(), res1, next1);
    expect(next1).not.toHaveBeenCalled();
    expect(auditRecorder).toHaveBeenLastCalledWith(
      expect.objectContaining({ level: 'notice' }),
      expect.any(Object),
    );

    const res2 = createResponse();
    const next2 = jest.fn();
    await middleware(buildRequest(), res2, next2);
    expect(auditRecorder).toHaveBeenLastCalledWith(
      expect.objectContaining({
        level: 'error',
        metadata: expect.objectContaining({
          autoBlock: expect.objectContaining({ triggered: true, hits: 2 }),
        }),
      }),
      expect.any(Object),
    );
    expect(res2.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Request blocked by security policy.',
        autoBlock: expect.objectContaining({ triggered: true, hits: 2 }),
      }),
    );

    const snapshotAfterEscalation = getWebApplicationFirewallSnapshot();
    expect(snapshotAfterEscalation.autoBlock.totalTriggered).toBe(1);
    expect(snapshotAfterEscalation.autoBlock.active[0]).toEqual(
      expect.objectContaining({ ip: '198.51.100.42', hits: 2 }),
    );

    const res3 = createResponse();
    const next3 = jest.fn();
    const cleanRequest = {
      method: 'GET',
      originalUrl: '/api/projects',
      headers: {},
      ip: '198.51.100.42',
    };
    await middleware(cleanRequest, res3, next3);
    expect(res3.json).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: 'auto-block',
        autoBlock: expect.objectContaining({ triggered: false }),
      }),
    );
    expect(auditRecorder).toHaveBeenLastCalledWith(
      expect.objectContaining({ level: 'warn' }),
      expect.any(Object),
    );
  });
});
