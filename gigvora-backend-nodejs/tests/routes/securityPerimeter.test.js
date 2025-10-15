import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

import createWebApplicationFirewall from '../../src/middleware/webApplicationFirewall.js';
import {
  configureWebApplicationFirewall,
  resetWebApplicationFirewallMetrics,
  getWebApplicationFirewallSnapshot,
} from '../../src/security/webApplicationFirewall.js';
import { resetPerimeterMetrics, getPerimeterSnapshot } from '../../src/observability/perimeterMetrics.js';

const FLOW_SYMBOL = Symbol('security-flow');

describe('security perimeter integration (lightweight app)', () => {
  const auditRecorder = jest.fn().mockResolvedValue(null);
  let app;
  let middlewareOrder;

  beforeEach(() => {
    configureWebApplicationFirewall({
      env: {
        WAF_AUTO_BLOCK_THRESHOLD: '1',
        WAF_AUTO_BLOCK_WINDOW_SECONDS: '300',
        WAF_AUTO_BLOCK_TTL_SECONDS: '600',
      },
    });
    resetWebApplicationFirewallMetrics();
    resetPerimeterMetrics();
    auditRecorder.mockClear();
    middlewareOrder = [];

    const recordStage = (req, stage) => {
      if (!req[FLOW_SYMBOL]) {
        req[FLOW_SYMBOL] = [];
        middlewareOrder.push(req[FLOW_SYMBOL]);
      }
      req[FLOW_SYMBOL].push(stage);
    };

    app = express();
    app.disable('x-powered-by');
    app.use((req, res, next) => {
      recordStage(req, 'correlation');
      req.id = 'test-request';
      next();
    });
    const wafMiddleware = createWebApplicationFirewall({
      auditRecorder,
      logger: undefined,
    });
    app.use((req, res, next) => {
      recordStage(req, 'waf');
      return wafMiddleware(req, res, next);
    });
    app.use((req, res, next) => {
      recordStage(req, 'logger');
      next();
    });
    app.get('/api/ping', (req, res) => {
      recordStage(req, 'route');
      res.json({ ok: true });
    });
  });

  afterAll(() => {
    configureWebApplicationFirewall({ env: {} });
    resetWebApplicationFirewallMetrics();
    resetPerimeterMetrics();
  });

  it('blocks malicious traffic before later middleware and surfaces auto-block telemetry', async () => {
    const malicious = await request(app)
      .get("/api/ping?search=%27%20UNION%20SELECT%20password%20FROM%20users--")
      .set('User-Agent', 'sqlmap/1.7.1');

    expect(malicious.status).toBe(403);
    expect(malicious.body).toMatchObject({
      message: 'Request blocked by security policy.',
      reason: 'rule-match',
      autoBlock: expect.objectContaining({ triggered: true, hits: 1 }),
    });

    const followUp = await request(app)
      .get('/api/ping')
      .set('User-Agent', 'Mozilla/5.0 (compatible; TestSuite/1.0)');

    expect(followUp.status).toBe(403);
    expect(followUp.body).toMatchObject({
      reason: 'auto-block',
      autoBlock: expect.objectContaining({ triggered: false, hits: 1 }),
    });

    const snapshot = getWebApplicationFirewallSnapshot();
    expect(snapshot.blockedRequests).toBe(2);
    expect(snapshot.autoBlock.totalTriggered).toBe(1);
    expect(snapshot.autoBlock.active[0]).toEqual(
      expect.objectContaining({ hits: 1, ip: expect.any(String) }),
    );

    const perimeter = getPerimeterSnapshot();
    expect(perimeter.totalBlocked).toBe(2);

    expect(middlewareOrder).toEqual([
      ['correlation', 'waf'],
      ['correlation', 'waf'],
    ]);
    expect(auditRecorder).toHaveBeenCalled();
  });
});
