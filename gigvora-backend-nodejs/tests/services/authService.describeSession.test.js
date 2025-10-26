import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

const findUserByIdMock = jest.fn();
const sanitizeUserMock = jest.fn();
const evaluateForUserMock = jest.fn();
const getLatestRefreshSessionForUserMock = jest.fn();

const loggerModuleUrl = new URL('../../src/utils/logger.js', import.meta.url);
const serviceCatalogModuleUrl = new URL('../../src/domains/serviceCatalog.js', import.meta.url);
const refreshTokenStoreModuleUrl = new URL('../../src/services/refreshTokenStore.js', import.meta.url);
const twoFactorModuleUrl = new URL('../../src/services/twoFactorService.js', import.meta.url);

jest.unstable_mockModule(loggerModuleUrl.pathname, () => ({
  default: {
    child: () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.unstable_mockModule(twoFactorModuleUrl.pathname, () => ({
  default: {
    sendToken: jest.fn(),
    verifyToken: jest.fn(),
    resendToken: jest.fn(),
  },
}));

jest.unstable_mockModule(serviceCatalogModuleUrl.pathname, () => ({
  getAuthDomainService: () => ({
    findUserById: findUserByIdMock,
    sanitizeUser: sanitizeUserMock,
  }),
  getFeatureFlagService: () => ({
    evaluateForUser: evaluateForUserMock,
  }),
}));

jest.unstable_mockModule(refreshTokenStoreModuleUrl.pathname, () => ({
  getLatestRefreshSessionForUser: getLatestRefreshSessionForUserMock,
  getRefreshTokenInvalidation: jest.fn(),
  getRefreshTokenRevocation: jest.fn(),
  invalidateRefreshTokensForUser: jest.fn(),
  isRefreshTokenRevoked: jest.fn(),
  markRefreshTokenRevoked: jest.fn(),
  persistRefreshSession: jest.fn(),
}));

let authService;

beforeAll(async () => {
  ({ default: authService } = await import('../../src/services/authService.js'));
});

beforeEach(() => {
  jest.clearAllMocks();
  evaluateForUserMock.mockResolvedValue({});
  sanitizeUserMock.mockImplementation((user) => ({
    id: user.id,
    email: user.email,
    memberships: user.memberships ?? [],
    roles: user.roles ?? [],
    permissions: user.permissions ?? [],
    capabilities: user.capabilities ?? [],
  }));
});

describe('authService.describeSession', () => {
  it('returns feature flags, refresh metadata, and risk telemetry for the active user', async () => {
    const user = {
      id: 7,
      email: 'risk@example.com',
      userType: 'admin',
      memberships: ['admin'],
      roles: ['admin'],
      permissions: ['dashboard:view'],
      capabilities: ['manage:users'],
    };
    findUserByIdMock.mockResolvedValue(user);
    evaluateForUserMock.mockResolvedValue({ experiments: ['pilot'] });
    getLatestRefreshSessionForUserMock.mockResolvedValue({
      id: 321,
      userId: 7,
      deviceFingerprint: 'device-hash',
      deviceLabel: 'MacBook Pro',
      ipAddress: '203.0.113.5',
      userAgent: 'Mozilla/5.0',
      riskLevel: 'medium',
      riskScore: 55,
      riskSignals: [
        {
          code: 'new_device',
          severity: 'medium',
          message: 'Refresh from a new device',
          observedAt: '2024-09-01T12:00:00Z',
          metadata: { city: 'London' },
        },
        {
          code: 'new_device',
          severity: 'medium',
          message: 'Refresh from a new device',
          observedAt: '2024-09-01T12:00:00Z',
        },
      ],
      expiresAt: '2024-09-02T12:00:00Z',
      evaluatedAt: '2024-09-01T12:04:00Z',
      updatedAt: '2024-09-01T12:05:00Z',
      createdAt: '2024-09-01T11:55:00Z',
    });

    const result = await authService.describeSession(user.id, {
      traits: { persona: 'admin' },
      workspaceIds: ['42'],
    });

    expect(findUserByIdMock).toHaveBeenCalledWith(user.id);
    expect(evaluateForUserMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: user.id }),
      expect.objectContaining({ traits: expect.objectContaining({ persona: 'admin' }) }),
    );
    expect(getLatestRefreshSessionForUserMock).toHaveBeenCalledWith(user.id);

    expect(result.session.user).toMatchObject({ id: user.id, email: user.email });
    expect(result.session.featureFlags).toEqual({ experiments: ['pilot'] });
    expect(result.session.refreshMeta).toMatchObject({
      deviceLabel: 'MacBook Pro',
      deviceFingerprint: 'device-hash',
      ipAddress: '203.0.113.5',
      userAgent: 'Mozilla/5.0',
      riskLevel: 'medium',
      riskScore: 55,
    });
    expect(result.session.refreshMeta.riskSignals).toHaveLength(1);
    expect(result.session.refreshMeta.evaluatedAt).toBe('2024-09-01T12:04:00.000Z');
    expect(result.session.sessionRisk).toMatchObject({
      level: 'medium',
      score: 55,
      deviceLabel: 'MacBook Pro',
      ipAddress: '203.0.113.5',
      userAgent: 'Mozilla/5.0',
    });
    expect(result.session.sessionRisk.signals).toHaveLength(1);
    expect(result.session.sessionRisk.evaluatedAt).toBe('2024-09-01T12:04:00.000Z');
  });

  it('falls back to low risk when no refresh telemetry exists', async () => {
    findUserByIdMock.mockResolvedValue({
      id: 8,
      email: 'stable@example.com',
      memberships: ['member'],
      roles: [],
      permissions: [],
      capabilities: [],
    });
    getLatestRefreshSessionForUserMock.mockResolvedValue(null);

    const result = await authService.describeSession(8);

    expect(result.session.sessionRisk).toEqual(
      expect.objectContaining({ level: 'low', score: 0, signals: [] }),
    );
    expect(result.session.refreshMeta).toBeUndefined();
  });
});
