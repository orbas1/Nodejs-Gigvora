import express from 'express';
import request from 'supertest';
import { jest } from '@jest/globals';

process.env.LOG_LEVEL = 'silent';

const securityAuditModuleUrl = new URL('../../src/services/securityAuditService.js', import.meta.url);
const perimeterMetricsModuleUrl = new URL('../../src/observability/perimeterMetrics.js', import.meta.url);
const httpSecurityModuleUrl = new URL('../../src/config/httpSecurity.js', import.meta.url);

const recordRuntimeSecurityEventMock = jest.fn().mockResolvedValue(null);

jest.unstable_mockModule(securityAuditModuleUrl.pathname, () => ({
  recordRuntimeSecurityEvent: recordRuntimeSecurityEventMock,
}));

const { resetPerimeterMetrics, getPerimeterSnapshot } = await import(perimeterMetricsModuleUrl.pathname);
const {
  resolveAllowedOrigins,
  compileAllowedOriginRules,
  isOriginAllowed,
  createCorsMiddleware,
} = await import(httpSecurityModuleUrl.pathname);

describe('httpSecurity configuration', () => {
  beforeEach(() => {
    resetPerimeterMetrics();
    recordRuntimeSecurityEventMock.mockClear();
  });

  test('resolveAllowedOrigins merges defaults with environment overrides', () => {
    const env = {
      CLIENT_URL: 'https://app-preview.gigvora.com',
      ALLOWED_ORIGINS: 'https://partners.gigvora.com, https://*.gigvora-staging.com',
    };

    const origins = resolveAllowedOrigins(env);

    expect(origins).toEqual(expect.arrayContaining([
      'https://app-preview.gigvora.com',
      'https://partners.gigvora.com',
      'https://*.gigvora-staging.com',
      'https://app.gigvora.com',
    ]));
  });

  test('isOriginAllowed evaluates wildcard and exact matches', () => {
    const rules = compileAllowedOriginRules([
      'https://app.gigvora.com',
      'https://*.gigvora-staging.com',
    ]);

    expect(isOriginAllowed('https://app.gigvora.com', rules)).toBe(true);
    expect(isOriginAllowed('https://admin.gigvora.com', rules)).toBe(false);
    expect(isOriginAllowed('https://ops.gigvora-staging.com', rules)).toBe(true);
    expect(isOriginAllowed('https://malicious.example.com', rules)).toBe(false);
  });

  test('createCorsMiddleware allows trusted origins and sets CORS headers', async () => {
    const app = express();
    const middleware = createCorsMiddleware({
      env: { CLIENT_URL: 'https://console.gigvora.com' },
      logger: { child: () => ({ warn: jest.fn() }) },
    });

    app.use(middleware);
    app.get('/health', (req, res) => {
      res.json({ status: 'ok' });
    });

    const response = await request(app)
      .get('/health')
      .set('Origin', 'https://console.gigvora.com');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe('https://console.gigvora.com');
  });

  test('createCorsMiddleware blocks untrusted origins and records perimeter telemetry', async () => {
    const warn = jest.fn();
    const app = express();
    const middleware = createCorsMiddleware({
      env: { CLIENT_URL: 'https://console.gigvora.com' },
      logger: { child: () => ({ warn }) },
    });

    app.use((req, res, next) => {
      req.id = 'req-test';
      next();
    });
    app.use(middleware);
    app.get('/secure', (req, res) => {
      res.json({ ok: true });
    });

    const response = await request(app)
      .get('/secure')
      .set('Origin', 'https://attacker.example.com');

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ message: 'Origin not allowed for this resource.', requestId: 'req-test' });
    expect(warn).toHaveBeenCalledWith({ origin: 'https://attacker.example.com', path: '/secure' }, expect.any(String));

    const snapshot = getPerimeterSnapshot();
    expect(snapshot.totalBlocked).toBe(1);
    expect(snapshot.blockedOrigins[0].origin).toBe('https://attacker.example.com');
    expect(recordRuntimeSecurityEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'security.perimeter.origin_blocked',
        metadata: expect.objectContaining({ origin: 'https://attacker.example.com' }),
        requestId: 'req-test',
      }),
      expect.any(Object),
    );
  });
});
