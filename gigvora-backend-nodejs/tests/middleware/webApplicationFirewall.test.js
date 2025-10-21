import { jest } from '@jest/globals';

const moduleUrl = new URL('../../src/middleware/webApplicationFirewall.js', import.meta.url);
const wafEngineModuleUrl = new URL('../../src/security/webApplicationFirewall.js', import.meta.url);
const perimeterModuleUrl = new URL('../../src/observability/perimeterMetrics.js', import.meta.url);
const loggerModuleUrl = new URL('../../src/utils/logger.js', import.meta.url);
const auditServiceModuleUrl = new URL('../../src/services/securityAuditService.js', import.meta.url);

let evaluateRequest;
let recordBlockedOrigin;
let loggerInstance;
let recordRuntimeSecurityEvent;

beforeEach(() => {
  jest.resetModules();

  evaluateRequest = jest.fn();
  recordBlockedOrigin = jest.fn();
  recordRuntimeSecurityEvent = jest.fn().mockResolvedValue();
  loggerInstance = {
    child: jest.fn(function child() {
      return loggerInstance;
    }),
    error: jest.fn(),
    warn: jest.fn(),
  };

  jest.unstable_mockModule(wafEngineModuleUrl.pathname, () => ({ evaluateRequest }));
  jest.unstable_mockModule(perimeterModuleUrl.pathname, () => ({ recordBlockedOrigin }));
  jest.unstable_mockModule(loggerModuleUrl.pathname, () => ({ default: loggerInstance }));
  jest.unstable_mockModule(auditServiceModuleUrl.pathname, () => ({
    recordRuntimeSecurityEvent,
  }));
  const randomUUID = jest.fn(() => 'generated-reference');
  jest.unstable_mockModule('node:crypto', () => ({
    default: { randomUUID },
    randomUUID,
  }));
});

afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

describe('middleware/webApplicationFirewall', () => {
  it('allows requests that pass the evaluation step', async () => {
    evaluateRequest.mockResolvedValue({ allowed: true });
    const { default: createWebApplicationFirewall } = await import(moduleUrl.pathname);
    const middleware = createWebApplicationFirewall();

    const next = jest.fn();
    await middleware({ originalUrl: '/health' }, {}, next);

    expect(evaluateRequest).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    expect(recordBlockedOrigin).not.toHaveBeenCalled();
  });

  it('blocks malicious requests and records telemetry with a provided audit recorder', async () => {
    evaluateRequest.mockResolvedValue({
      allowed: false,
      method: 'POST',
      path: '/api/users',
      ip: '203.0.113.10',
      origin: 'https://bad.example',
      reason: 'auto-block',
      userAgent: 'curl/8.0',
      matchedRules: [{ id: 'waf-1' }],
      autoBlock: {
        triggered: true,
        blockedAt: '2023-05-01T00:00:00Z',
        expiresAt: '2023-05-01T01:00:00Z',
        hits: 5,
        threshold: 5,
        windowSeconds: 300,
      },
      detectedAt: '2023-05-01T00:00:01Z',
      referenceId: 'ref-123',
    });

    const auditRecorder = jest.fn().mockResolvedValue();
    const { default: createWebApplicationFirewall } = await import(moduleUrl.pathname);
    const middleware = createWebApplicationFirewall({ auditRecorder });

    const json = jest.fn();
    const res = { status: jest.fn().mockReturnValue({ json }) };
    const req = { id: 'req-1', originalUrl: '/api/users' };

    await middleware(req, res, jest.fn());

    expect(recordBlockedOrigin).toHaveBeenCalledWith('https://bad.example', {
      path: '/api/users',
      method: 'POST',
    });
    expect(auditRecorder).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Request blocked by security policy.',
        referenceId: 'ref-123',
        reason: 'auto-block',
        autoBlock: expect.objectContaining({ triggered: true }),
      }),
    );
  });

  it('imports the audit service dynamically when no recorder is provided', async () => {
    evaluateRequest.mockResolvedValue({
      allowed: false,
      method: 'GET',
      path: '/api/metrics',
      reason: 'ip-blocked',
      ip: '198.51.100.5',
      matchedRules: [],
    });

    const { default: createWebApplicationFirewall } = await import(moduleUrl.pathname);
    const middleware = createWebApplicationFirewall();

    await middleware({ id: 'req-2', originalUrl: '/api/metrics' }, { status: jest.fn().mockReturnValue({ json: jest.fn() }) }, jest.fn());

    expect(recordRuntimeSecurityEvent).toHaveBeenCalledTimes(1);
  });

  it('fails closed when evaluation throws an error', async () => {
    const evaluationError = new Error('engine failure');
    evaluateRequest.mockRejectedValue(evaluationError);
    const { default: createWebApplicationFirewall } = await import(moduleUrl.pathname);
    const middleware = createWebApplicationFirewall();

    const json = jest.fn();
    const res = { status: jest.fn().mockReturnValue({ json }) };

    await middleware({ originalUrl: '/api/data' }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({ message: 'Request blocked by security policy.', requestId: null });
    expect(loggerInstance.error).toHaveBeenCalledTimes(1);
    expect(recordBlockedOrigin).not.toHaveBeenCalled();
  });
});
