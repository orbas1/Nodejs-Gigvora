import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

const updateLastLoginMock = jest.fn().mockResolvedValue();
const recordLoginAuditMock = jest.fn().mockResolvedValue();
const sanitizeUserMock = jest.fn();
const findUserByIdMock = jest.fn();
const evaluateForUserMock = jest.fn().mockResolvedValue({ runtime: true });

const serviceCatalogModuleUrl = new URL('../../src/domains/serviceCatalog.js', import.meta.url);
const twoFactorModuleUrl = new URL('../../src/services/twoFactorService.js', import.meta.url);
const loggerModuleUrl = new URL('../../src/utils/logger.js', import.meta.url);
const refreshTokenStoreModuleUrl = new URL('../../src/services/refreshTokenStore.js', import.meta.url);

jest.unstable_mockModule(loggerModuleUrl.pathname, () => ({
  default: {
    child: () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.unstable_mockModule(serviceCatalogModuleUrl.pathname, () => ({
  getAuthDomainService: () => ({
    updateLastLogin: updateLastLoginMock,
    recordLoginAudit: recordLoginAuditMock,
    sanitizeUser: sanitizeUserMock,
    findUserById: findUserByIdMock,
  }),
  getFeatureFlagService: () => ({
    evaluateForUser: evaluateForUserMock,
  }),
}));

jest.unstable_mockModule(twoFactorModuleUrl.pathname, () => ({
  default: {
    sendToken: jest.fn(),
    verifyToken: jest.fn(),
    resendTwoFactor: jest.fn(),
  },
}));

let authService;
let refreshTokenStore;

beforeAll(async () => {
  ({ default: authService } = await import('../../src/services/authService.js'));
  refreshTokenStore = await import(refreshTokenStoreModuleUrl.pathname);
});

beforeEach(() => {
  refreshTokenStore.__dangerouslyResetRefreshTokenStore();
  updateLastLoginMock.mockClear();
  recordLoginAuditMock.mockClear();
  sanitizeUserMock.mockImplementation((user) => ({
    id: user.id,
    email: user.email,
    userType: user.userType,
    memberships: ['member'],
    roles: [],
    primaryDashboard: 'member',
    twoFactorEnabled: false,
    timezone: null,
    profile: null,
  }));
  findUserByIdMock.mockReset();
  evaluateForUserMock.mockClear();
});

describe('authService.refreshSession', () => {
  const user = {
    id: 'user-42',
    email: 'member@example.com',
    userType: 'member',
    twoFactorEnabled: false,
  };

  it('issues a new session, persists audit, and resolves feature flags', async () => {
    findUserByIdMock.mockResolvedValue({ ...user });
    const refreshToken = jwt.sign({ id: user.id, type: user.userType }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: '5m',
    });

    const result = await authService.refreshSession(refreshToken, {
      context: { ipAddress: '127.0.0.1', userAgent: 'jest' },
    });

    expect(refreshTokenStore.isRefreshTokenRevoked(refreshToken)).toBe(true);
    expect(result.session.accessToken).toEqual(expect.any(String));
    expect(result.session.refreshToken).toEqual(expect.any(String));
    expect(result.session.refreshToken).not.toEqual(refreshToken);
    expect(jwt.verify(result.session.accessToken, process.env.JWT_SECRET)).toMatchObject({
      id: user.id,
      type: user.userType,
    });
    expect(updateLastLoginMock).toHaveBeenCalledWith(user.id);
    expect(evaluateForUserMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: user.id }),
      expect.objectContaining({ traits: { loginContext: 'refresh_token' } }),
    );
    expect(recordLoginAuditMock).toHaveBeenCalledWith(
      user.id,
      expect.objectContaining({
        eventType: 'refresh_token_issued',
        metadata: { strategy: 'refresh_token' },
      }),
      {},
    );
    expect(result.session.user).toMatchObject({
      id: user.id,
      email: user.email,
      featureFlags: { runtime: true },
    });
  });

  it('clears tokens when the refresh token is expired', async () => {
    findUserByIdMock.mockResolvedValue({ ...user });
    const expiredToken = jwt.sign({ id: user.id, type: user.userType }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: '-10s',
    });

    await expect(authService.refreshSession(expiredToken)).rejects.toMatchObject({
      message: 'Refresh token has expired.',
      status: 401,
    });
    expect(findUserByIdMock).not.toHaveBeenCalled();
  });

  it('rejects invalid refresh tokens', async () => {
    await expect(authService.refreshSession('not-a-token')).rejects.toMatchObject({
      message: 'Invalid refresh token.',
      status: 401,
    });
    expect(findUserByIdMock).not.toHaveBeenCalled();
  });

  it('rejects refresh tokens that were revoked manually', async () => {
    const refreshToken = jwt.sign({ id: user.id, type: user.userType }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: '5m',
    });

    refreshTokenStore.markRefreshTokenRevoked(refreshToken, { userId: user.id, reason: 'test' });

    await expect(authService.refreshSession(refreshToken)).rejects.toMatchObject({
      message: 'Refresh token has been revoked.',
      status: 401,
    });
    expect(findUserByIdMock).not.toHaveBeenCalled();
  });

  it('fails when the user cannot be located', async () => {
    findUserByIdMock.mockResolvedValue(null);
    const refreshToken = jwt.sign({ id: user.id, type: user.userType }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: '5m',
    });

    await expect(authService.refreshSession(refreshToken)).rejects.toMatchObject({
      message: 'Account not found.',
      status: 404,
    });
  });

  it('rejects refresh tokens when the user has invalidated sessions', async () => {
    const refreshToken = jwt.sign({ id: user.id, type: user.userType }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: '5m',
    });
    refreshTokenStore.invalidateRefreshTokensForUser(user.id, { reason: 'test-invalidated' });

    await expect(authService.refreshSession(refreshToken)).rejects.toMatchObject({
      message: 'Refresh token has been revoked.',
      status: 401,
    });
    expect(findUserByIdMock).not.toHaveBeenCalled();
  });
});

describe('authService.revokeRefreshToken', () => {
  const user = {
    id: 'user-55',
    email: 'observer@example.com',
    userType: 'member',
  };

  it('marks a refresh token as revoked and records an audit event', async () => {
    const refreshToken = jwt.sign({ id: user.id, type: user.userType }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: '10m',
    });

    const result = await authService.revokeRefreshToken(refreshToken, {
      reason: 'logout',
      context: { ipAddress: '203.0.113.10', userAgent: 'jest' },
    });

    expect(result).toMatchObject({ success: true });
    expect(refreshTokenStore.isRefreshTokenRevoked(refreshToken)).toBe(true);
    expect(recordLoginAuditMock).toHaveBeenCalledWith(
      user.id,
      expect.objectContaining({
        eventType: 'refresh_token_revoked',
        metadata: { reason: 'logout' },
      }),
      {},
    );
  });

  it('is idempotent when the refresh token was already revoked', async () => {
    const refreshToken = jwt.sign({ id: user.id, type: user.userType }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: '10m',
    });

    refreshTokenStore.markRefreshTokenRevoked(refreshToken, { userId: user.id, reason: 'seed' });
    recordLoginAuditMock.mockClear();

    const result = await authService.revokeRefreshToken(refreshToken, { reason: 'repeat' });

    expect(result).toMatchObject({ success: true });
    expect(recordLoginAuditMock).not.toHaveBeenCalled();
  });
});
