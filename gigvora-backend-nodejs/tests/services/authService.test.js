import { describe, it, expect, beforeAll, beforeEach, jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.SMTP_HOST = 'smtp.test';
process.env.SMTP_PORT = '587';
process.env.PASSWORD_RESET_URL = 'https://app.test/reset-password';

const registerUserMock = jest.fn();
const findUserByEmailMock = jest.fn();
const findUserByIdMock = jest.fn();
const comparePasswordMock = jest.fn();
const updateLastLoginMock = jest.fn();
const recordLoginAuditMock = jest.fn();
const sanitizeUserMock = jest.fn();
const issuePasswordResetTokenMock = jest.fn();
const invalidatePasswordResetTokensMock = jest.fn();
const findPasswordResetTokenByHashMock = jest.fn();
const consumePasswordResetTokenMock = jest.fn();
const updateUserPasswordMock = jest.fn();
const evaluateForUserMock = jest.fn();

const sendTokenMock = jest.fn();
const verifyTokenMock = jest.fn();
const resendTokenMock = jest.fn();
const invalidateExistingMock = jest.fn();

const sendMailMock = jest.fn();
const createTransportMock = jest.fn(() => ({ sendMail: sendMailMock }));

const verifyIdTokenMock = jest.fn();
const oauthClientInstance = { verifyIdToken: verifyIdTokenMock };
const OAuth2ClientMock = jest.fn(() => oauthClientInstance);

const serviceCatalogModuleUrl = new URL('../../src/domains/serviceCatalog.js', import.meta.url);
const twoFactorModuleUrl = new URL('../../src/services/twoFactorService.js', import.meta.url);
const loggerModuleUrl = new URL('../../src/utils/logger.js', import.meta.url);

jest.unstable_mockModule(loggerModuleUrl.pathname, () => ({
  default: {
    child: () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.unstable_mockModule('google-auth-library', () => ({
  OAuth2Client: OAuth2ClientMock,
}));

jest.unstable_mockModule(serviceCatalogModuleUrl.pathname, () => ({
  getAuthDomainService: () => ({
    registerUser: registerUserMock,
    findUserByEmail: findUserByEmailMock,
    findUserById: findUserByIdMock,
    comparePassword: comparePasswordMock,
    updateLastLogin: updateLastLoginMock,
    recordLoginAudit: recordLoginAuditMock,
    sanitizeUser: sanitizeUserMock,
    issuePasswordResetToken: issuePasswordResetTokenMock,
    invalidatePasswordResetTokens: invalidatePasswordResetTokensMock,
    findPasswordResetTokenByHash: findPasswordResetTokenByHashMock,
    consumePasswordResetToken: consumePasswordResetTokenMock,
    updateUserPassword: updateUserPasswordMock,
  }),
  getFeatureFlagService: () => ({
    evaluateForUser: evaluateForUserMock,
  }),
}));

jest.unstable_mockModule(twoFactorModuleUrl.pathname, () => ({
  default: {
    sendToken: sendTokenMock,
    verifyToken: verifyTokenMock,
    resendToken: resendTokenMock,
    invalidateExisting: invalidateExistingMock,
  },
}));

jest.unstable_mockModule('nodemailer', () => ({
  default: { createTransport: createTransportMock },
  createTransport: createTransportMock,
}));

let authService;

beforeAll(async () => {
  ({ default: authService } = await import('../../src/services/authService.js'));
});

beforeEach(() => {
  jest.resetAllMocks();
  evaluateForUserMock.mockResolvedValue({ default: true });
  sanitizeUserMock.mockImplementation((user) => ({
    id: user.id,
    email: user.email,
    userType: user.userType,
    twoFactorEnabled: user.twoFactorEnabled ?? false,
    twoFactorMethod: user.twoFactorMethod ?? 'email',
    memberships: user.memberships ?? ['member'],
  }));
  resendTokenMock.mockResolvedValue({ tokenId: 'retry-token', delivered: true });
  OAuth2ClientMock.mockImplementation(() => oauthClientInstance);
  findUserByIdMock.mockResolvedValue(null);
  issuePasswordResetTokenMock.mockResolvedValue({ id: 'prt-1', expiresAt: new Date().toISOString() });
  invalidatePasswordResetTokensMock.mockResolvedValue(0);
  findPasswordResetTokenByHashMock.mockResolvedValue(null);
  consumePasswordResetTokenMock.mockResolvedValue(1);
  updateUserPasswordMock.mockResolvedValue();
  invalidateExistingMock.mockResolvedValue();
  sendMailMock.mockResolvedValue();
  createTransportMock.mockReturnValue({ sendMail: sendMailMock });
});

describe('authService.register', () => {
  it('registers a user, enforces password policy, and resolves feature flags', async () => {
    const sanitizedUser = {
      id: 'user-001',
      email: 'person@example.com',
      userType: 'admin',
      twoFactorEnabled: true,
      twoFactorMethod: 'app',
    };
    registerUserMock.mockResolvedValue(sanitizedUser);
    evaluateForUserMock.mockReset();
    evaluateForUserMock.mockResolvedValue({
      experiments: ['beta-dashboard'],
      rollout: { adminConsole: true },
    });

    const payload = {
      email: sanitizedUser.email,
      password: 'strong-pass-42',
      firstName: 'Jordan',
      lastName: 'Lee',
      signupChannel: 'web',
      userType: 'admin',
    };

    const result = await authService.register(payload);

    expect(registerUserMock).toHaveBeenCalledWith(payload);
    expect(result).toEqual({
      ...sanitizedUser,
      featureFlags: {
        experiments: ['beta-dashboard'],
        rollout: { adminConsole: true },
      },
    });
    expect(evaluateForUserMock).toHaveBeenCalledWith(sanitizedUser, {
      traits: { signupChannel: 'web', persona: 'admin' },
    });
  });

  it('rejects passwords that do not meet the minimum policy', async () => {
    await expect(
      authService.register({ email: 'weak@example.com', password: 'short' }),
    ).rejects.toMatchObject({
      message: 'Password must be at least 8 characters long.',
      status: 422,
    });
    expect(registerUserMock).not.toHaveBeenCalled();
  });
});

describe('authService.login', () => {
  const baseUser = {
    id: 'user-002',
    email: 'member@example.com',
    userType: 'member',
    password: 'hashed',
    twoFactorEnabled: true,
    twoFactorMethod: 'app',
  };

  it('returns a two factor challenge when multi factor is enabled', async () => {
    evaluateForUserMock.mockReset();
    findUserByEmailMock.mockResolvedValue({ ...baseUser });
    comparePasswordMock.mockResolvedValue(true);
    sendTokenMock.mockResolvedValue({
      tokenId: '2fa-token-1',
      maskedDestination: 'm***@example.com',
      debugCode: '123456',
      expiresAt: new Date('2024-07-01T10:00:00Z').toISOString(),
    });
    evaluateForUserMock.mockResolvedValue({ loginGate: 'pending' });

    const result = await authService.login(baseUser.email, 'correct-password', {
      context: { ipAddress: '203.0.113.1' },
    });

    expect(findUserByEmailMock).toHaveBeenCalledWith(baseUser.email);
    expect(comparePasswordMock).toHaveBeenCalledWith({ ...baseUser }, 'correct-password');
    expect(sendTokenMock).toHaveBeenCalledWith(baseUser.email, {
      deliveryMethod: 'app',
      context: { ipAddress: '203.0.113.1' },
    });
    expect(result).toEqual({
      requiresTwoFactor: true,
      challenge: expect.objectContaining({ tokenId: '2fa-token-1', maskedDestination: 'm***@example.com' }),
      user: {
        id: baseUser.id,
        email: baseUser.email,
        userType: baseUser.userType,
        twoFactorEnabled: true,
        twoFactorMethod: 'app',
        memberships: ['member'],
        featureFlags: { loginGate: 'pending' },
      },
    });
    expect(updateLastLoginMock).not.toHaveBeenCalled();
    expect(recordLoginAuditMock).not.toHaveBeenCalled();
  });

  it('creates a session when multi factor is disabled, applying login context traits', async () => {
    evaluateForUserMock.mockReset();
    const user = { ...baseUser, twoFactorEnabled: false };
    findUserByEmailMock.mockResolvedValue(user);
    comparePasswordMock.mockResolvedValue(true);
    evaluateForUserMock.mockResolvedValue({ runtime: ['workspace-home'] });

    const result = await authService.login(user.email, 'correct-password', {
      context: { ipAddress: '198.51.100.24', userAgent: 'jest' },
      workspaceIds: ['ws-1'],
    });

    expect(sendTokenMock).not.toHaveBeenCalled();
    expect(updateLastLoginMock).toHaveBeenCalledWith(user.id);
    expect(recordLoginAuditMock).toHaveBeenCalledWith(
      user.id,
      expect.objectContaining({
        eventType: 'login',
        ipAddress: '198.51.100.24',
        userAgent: 'jest',
        metadata: { strategy: 'password' },
      }),
      {},
    );
    expect(evaluateForUserMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: user.id }),
      expect.objectContaining({
        workspaceIds: ['ws-1'],
        traits: { loginContext: 'ip_tracked' },
      }),
    );
    expect(result.requiresTwoFactor).toBe(false);
    expect(result.session.accessToken).toEqual(expect.any(String));
    expect(result.session.refreshToken).toEqual(expect.any(String));
    expect(jwt.verify(result.session.accessToken, process.env.JWT_SECRET)).toMatchObject({
      id: user.id,
      type: user.userType,
    });
    expect(result.session.user).toMatchObject({
      id: user.id,
      email: user.email,
      featureFlags: { runtime: ['workspace-home'] },
    });
  });

  it('enforces admin RBAC when required', async () => {
    findUserByEmailMock.mockResolvedValue({ ...baseUser, userType: 'member', twoFactorEnabled: false });
    comparePasswordMock.mockResolvedValue(true);

    await expect(
      authService.login(baseUser.email, 'correct-password', { requireAdmin: true }),
    ).rejects.toMatchObject({ message: 'Admin access required', status: 403 });

    expect(comparePasswordMock).not.toHaveBeenCalled();
  });
});

describe('authService.verifyTwoFactor', () => {
  const email = 'factor@example.com';
  const user = {
    id: 'user-003',
    email,
    userType: 'member',
    twoFactorEnabled: true,
    twoFactorMethod: 'app',
  };

  it('validates the token, creates a session, and audits the login', async () => {
    evaluateForUserMock.mockReset();
    verifyTokenMock.mockResolvedValue({ tokenId: 'verified-token' });
    findUserByEmailMock.mockResolvedValue(user);
    evaluateForUserMock.mockResolvedValue({ runtime: ['dashboard'] });

    const result = await authService.verifyTwoFactor(email, '321654', 'verified-token', {
      context: { ipAddress: '192.0.2.10', userAgent: 'jest' },
      workspaceIds: ['space-7'],
    });

    expect(verifyTokenMock).toHaveBeenCalledWith({ email, code: '321654', tokenId: 'verified-token' });
    expect(findUserByEmailMock).toHaveBeenCalledWith(email);
    expect(updateLastLoginMock).toHaveBeenCalledWith(user.id);
    expect(recordLoginAuditMock).toHaveBeenCalledWith(
      user.id,
      expect.objectContaining({ eventType: 'two_factor_verified', metadata: { strategy: 'password' } }),
      {},
    );
    expect(result.session.user).toMatchObject({ email, featureFlags: { runtime: ['dashboard'] } });
  });

  it('rejects invalid or expired tokens without querying the account', async () => {
    verifyTokenMock.mockResolvedValue(null);

    await expect(authService.verifyTwoFactor(email, '999000', 'bad-token')).rejects.toMatchObject({
      message: 'Invalid or expired code',
      status: 401,
    });
    expect(findUserByEmailMock).not.toHaveBeenCalled();
  });
});

describe('authService.resendTwoFactor', () => {
  it('requires a token id', async () => {
    await expect(authService.resendTwoFactor()).rejects.toMatchObject({
      message: 'tokenId is required to resend a 2FA code.',
      status: 422,
    });
  });

  it('delegates to the two factor service', async () => {
    resendTokenMock.mockResolvedValue({ tokenId: 'token-22', delivered: true });
    const response = await authService.resendTwoFactor('token-22');
    expect(resendTokenMock).toHaveBeenCalledWith('token-22');
    expect(response).toEqual({ tokenId: 'token-22', delivered: true });
  });
});

describe('authService.requestPasswordReset', () => {
  it('issues a token, sends an email, and audits the request', async () => {
    const user = { id: 41, email: 'reset@example.com', userType: 'user', twoFactorEnabled: false };
    findUserByEmailMock.mockResolvedValue(user);

    const result = await authService.requestPasswordReset('reset@example.com', {
      redirectUri: 'https://app.test/reset-password?utm_source=test',
      context: { ipAddress: '198.51.100.5', userAgent: 'jest-test' },
    });

    expect(issuePasswordResetTokenMock).toHaveBeenCalledWith(
      user.id,
      expect.objectContaining({
        tokenHash: expect.any(String),
        expiresAt: expect.any(Date),
        ipAddress: '198.51.100.5',
        userAgent: 'jest-test',
      }),
    );
    expect(createTransportMock).toHaveBeenCalled();
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: user.email,
        subject: 'Reset your Gigvora password',
      }),
    );
    expect(recordLoginAuditMock).toHaveBeenCalledWith(
      user.id,
      expect.objectContaining({ eventType: 'password_reset_requested' }),
      {},
    );
    expect(result).toMatchObject({ delivered: true });
  });

  it('silently succeeds when the account does not exist', async () => {
    findUserByEmailMock.mockResolvedValue(null);

    const response = await authService.requestPasswordReset('ghost@example.com');

    expect(issuePasswordResetTokenMock).not.toHaveBeenCalled();
    expect(sendMailMock).not.toHaveBeenCalled();
    expect(recordLoginAuditMock).not.toHaveBeenCalled();
    expect(response).toEqual({ delivered: true });
  });

  it('bubbles SMTP failures to the caller', async () => {
    const user = { id: 52, email: 'smtp-fail@example.com', userType: 'user', twoFactorEnabled: false };
    findUserByEmailMock.mockResolvedValue(user);
    sendMailMock.mockRejectedValue(new Error('smtp down'));

    await expect(authService.requestPasswordReset(user.email)).rejects.toMatchObject({
      message: 'Unable to send password reset email.',
      status: 500,
    });
    expect(recordLoginAuditMock).not.toHaveBeenCalledWith(
      user.id,
      expect.objectContaining({ eventType: 'password_reset_requested' }),
      {},
    );
  });
});

describe('authService.resetPassword', () => {
  it('validates the token, updates the password, and returns a session', async () => {
    const rawToken = 'reset-token-value';
    const expectedHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const tokenRecord = {
      id: 'prt-1',
      userId: 77,
      tokenHash: expectedHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      consumedAt: null,
    };
    const user = {
      id: 77,
      email: 'reset@example.com',
      userType: 'user',
      twoFactorEnabled: false,
      twoFactorMethod: 'email',
    };
    findPasswordResetTokenByHashMock.mockResolvedValue(tokenRecord);
    findUserByIdMock.mockResolvedValue(user);
    evaluateForUserMock.mockResolvedValue({ runtime: ['password-reset'] });

    const response = await authService.resetPassword(rawToken, 'NewPassword123!', {
      context: { ipAddress: '203.0.113.10', userAgent: 'jest-suite' },
    });

    expect(findPasswordResetTokenByHashMock).toHaveBeenCalledWith(expectedHash);
    expect(updateUserPasswordMock).toHaveBeenCalledWith(user.id, 'NewPassword123!');
    expect(consumePasswordResetTokenMock).toHaveBeenCalledWith(tokenRecord.id);
    expect(invalidatePasswordResetTokensMock).toHaveBeenCalledWith(user.id);
    expect(invalidateExistingMock).toHaveBeenCalledWith(user.email);
    expect(recordLoginAuditMock).toHaveBeenCalledWith(
      user.id,
      expect.objectContaining({ eventType: 'password_reset_completed' }),
      {},
    );
    expect(response.session).toBeDefined();
    expect(response.session.user).toMatchObject({ email: user.email, featureFlags: { runtime: ['password-reset'] } });
  });

  it('rejects invalid or missing tokens', async () => {
    findPasswordResetTokenByHashMock.mockResolvedValue(null);

    await expect(authService.resetPassword('invalid-token', 'Password123!')).rejects.toMatchObject({
      message: 'Reset token is invalid or has expired.',
      status: 401,
    });
    expect(updateUserPasswordMock).not.toHaveBeenCalled();
  });

  it('invalidates stale tokens and rejects when expired', async () => {
    const tokenRecord = {
      id: 'prt-expired',
      userId: 91,
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() - 60 * 1000).toISOString(),
      consumedAt: null,
    };
    findPasswordResetTokenByHashMock.mockResolvedValue(tokenRecord);

    await expect(authService.resetPassword('expired', 'Password123!')).rejects.toMatchObject({
      message: 'Reset token is invalid or has expired.',
      status: 401,
    });
    expect(invalidatePasswordResetTokensMock).toHaveBeenCalledWith(tokenRecord.userId);
  });

  it('rejects when the user cannot be located', async () => {
    const tokenRecord = {
      id: 'prt-orphaned',
      userId: 104,
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      consumedAt: null,
    };
    findPasswordResetTokenByHashMock.mockResolvedValue(tokenRecord);
    findUserByIdMock.mockResolvedValue(null);

    await expect(authService.resetPassword('token', 'Password123!')).rejects.toMatchObject({
      message: 'Account not found.',
      status: 404,
    });
  });
});

describe('authService.loginWithGoogle', () => {
  beforeEach(() => {
    verifyIdTokenMock.mockReset();
  });

  it('creates an account when the email is new and issues a session', async () => {
    evaluateForUserMock.mockReset();
    const payload = {
      email: 'oauth-new@example.com',
      email_verified: true,
      sub: 'google-123',
      given_name: 'OAuth',
      family_name: 'User',
    };
    const createdUser = {
      id: 'user-004',
      email: payload.email,
      userType: 'user',
      twoFactorEnabled: false,
      twoFactorMethod: 'app',
    };

    verifyIdTokenMock.mockResolvedValue({ getPayload: () => payload });
    registerUserMock.mockResolvedValue(createdUser);
    findUserByEmailMock
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ ...createdUser });
    evaluateForUserMock.mockResolvedValue({ runtime: ['google-oauth'] });

    const randomBytesSpy = jest.spyOn(crypto, 'randomBytes').mockReturnValue(Buffer.from('a'.repeat(64), 'hex'));

    const result = await authService.loginWithGoogle('test-id-token', {
      context: { ipAddress: '203.0.113.15', userAgent: 'jest' },
    });

    expect(OAuth2ClientMock).toHaveBeenCalledWith('test-google-client-id');
    expect(verifyIdTokenMock).toHaveBeenCalledWith({ idToken: 'test-id-token', audience: 'test-google-client-id' });
    expect(registerUserMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: payload.email,
        firstName: 'OAuth',
        lastName: 'User',
        userType: 'user',
        googleId: 'google-123',
        twoFactorEnabled: false,
      }),
    );
    expect(findUserByEmailMock).toHaveBeenNthCalledWith(1, payload.email);
    expect(findUserByEmailMock).toHaveBeenNthCalledWith(2, payload.email);
    expect(updateLastLoginMock).toHaveBeenCalledWith(createdUser.id);
    expect(recordLoginAuditMock).toHaveBeenCalledWith(
      createdUser.id,
      expect.objectContaining({
        eventType: 'login',
        metadata: { strategy: 'google_oauth' },
      }),
      {},
    );
    expect(result.session.user).toMatchObject({
      email: payload.email,
      featureFlags: { runtime: ['google-oauth'] },
    });
    randomBytesSpy.mockRestore();
  });

  it('rejects when the google payload is not verified', async () => {
    verifyIdTokenMock.mockResolvedValue({ getPayload: () => ({ email: 'test@example.com', email_verified: false }) });

    await expect(authService.loginWithGoogle('token')).rejects.toMatchObject({
      message: 'Google email address is not verified.',
      status: 401,
    });
  });
});
