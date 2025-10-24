import request from 'supertest';
import { jest } from '@jest/globals';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';

const registerMock = jest.fn().mockResolvedValue({ id: 1, email: 'user@example.com' });
const loginMock = jest.fn().mockResolvedValue({ session: { accessToken: 'token', refreshToken: 'refresh' } });
const verifyTwoFactorMock = jest.fn().mockResolvedValue({ session: { accessToken: 'token' } });
const resendTwoFactorMock = jest.fn().mockResolvedValue({ tokenId: 'resent-token' });
const googleLoginMock = jest.fn().mockResolvedValue({ session: { accessToken: 'google-token' } });
const refreshSessionMock = jest.fn().mockResolvedValue({
  session: {
    accessToken: 'new-access',
    refreshToken: 'new-refresh',
    user: { id: 1 },
  },
});
const requestPasswordResetMock = jest.fn().mockResolvedValue({ delivered: true });
const resetPasswordMock = jest.fn().mockResolvedValue({ session: { accessToken: 'reset', refreshToken: 'reset-refresh' } });

const authServiceModuleUrl = new URL('../../src/services/authService.js', import.meta.url);
const loggerModuleUrl = new URL('../../src/utils/logger.js', import.meta.url);
const modelsModuleUrl = new URL('../../src/models/index.js', import.meta.url);

const companyProfileCreateMock = jest.fn();
const agencyProfileCreateMock = jest.fn();

jest.unstable_mockModule(authServiceModuleUrl.pathname, () => ({
  default: {
    register: registerMock,
    login: loginMock,
    verifyTwoFactor: verifyTwoFactorMock,
    resendTwoFactor: resendTwoFactorMock,
    loginWithGoogle: googleLoginMock,
    refreshSession: refreshSessionMock,
    requestPasswordReset: requestPasswordResetMock,
    resetPassword: resetPasswordMock,
  },
}));

jest.unstable_mockModule(loggerModuleUrl.pathname, () => ({
  default: {
    child: () => ({ info: jest.fn(), error: jest.fn(), debug: jest.fn(), warn: jest.fn() }),
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.unstable_mockModule(modelsModuleUrl.pathname, () => ({
  CompanyProfile: { create: companyProfileCreateMock },
  AgencyProfile: { create: agencyProfileCreateMock },
  default: {},
}));

let app;

beforeAll(async () => {
  const expressModule = await import('express');
  const { default: correlationId } = await import('../../src/middleware/correlationId.js');
  const { default: errorHandler } = await import('../../src/middleware/errorHandler.js');
  const { default: authRoutes } = await import('../../src/routes/authRoutes.js');
  const express = expressModule.default;
  app = express();
  app.use(express.json());
  app.use(correlationId());
  app.use('/api/auth', authRoutes);
  app.use(errorHandler);
});

beforeEach(() => {
  registerMock.mockClear();
  loginMock.mockClear();
  verifyTwoFactorMock.mockClear();
  resendTwoFactorMock.mockClear();
  googleLoginMock.mockClear();
  refreshSessionMock.mockClear();
  requestPasswordResetMock.mockClear();
  resetPasswordMock.mockClear();
});

describe('POST /api/auth/register', () => {
  it('rejects payloads missing required fields', async () => {
    const response = await request(app).post('/api/auth/register').send({ password: 'Secret123!' });

    expect(response.status).toBe(422);
    expect(response.body).toEqual(expect.objectContaining({ message: 'Request validation failed.' }));
    expect(registerMock).not.toHaveBeenCalled();
  });

  it('normalises payloads before invoking the auth service', async () => {
    registerMock.mockResolvedValueOnce({ id: 42, email: 'user@example.com' });

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: ' USER@Example.COM ',
        password: '  StrongPass123! ',
        firstName: '  Alex  ',
        lastName: ' Morgan ',
        location: '  London ',
        age: '29',
        signupChannel: ' WEB  ',
        twoFactorEnabled: 'false',
        twoFactorMethod: 'SMS',
      });

    expect(response.status).toBe(201);
    expect(registerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'user@example.com',
        password: 'StrongPass123!',
        firstName: 'Alex',
        lastName: 'Morgan',
        location: 'London',
        age: 29,
        signupChannel: 'WEB',
        twoFactorEnabled: false,
        twoFactorMethod: 'sms',
      }),
    );
  });
});

describe('POST /api/auth/login', () => {
  it('rejects malformed credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: 'password' });

    expect(response.status).toBe(422);
    expect(loginMock).not.toHaveBeenCalled();
  });
});

describe('POST /api/auth/two-factor/resend', () => {
  it('requires a token identifier', async () => {
    const response = await request(app).post('/api/auth/two-factor/resend').send({});

    expect(response.status).toBe(422);
    expect(resendTwoFactorMock).not.toHaveBeenCalled();
  });
});

describe('POST /api/auth/password/reset-request', () => {
  it('validates the payload', async () => {
    const response = await request(app).post('/api/auth/password/reset-request').send({});

    expect(response.status).toBe(422);
    expect(requestPasswordResetMock).not.toHaveBeenCalled();
  });

  it('normalises the email and forwards metadata to the service', async () => {
    const response = await request(app)
      .post('/api/auth/password/reset-request')
      .set('User-Agent', 'jest-agent')
      .send({ email: ' RESET@Example.COM ', redirectUri: 'https://app.test/reset-password ' });

    expect(response.status).toBe(200);
    expect(requestPasswordResetMock).toHaveBeenCalledWith(
      'RESET@Example.COM'.trim().toLowerCase(),
      expect.objectContaining({
        redirectUri: 'https://app.test/reset-password',
        context: expect.objectContaining({
          ipAddress: expect.any(String),
          userAgent: 'jest-agent',
        }),
      }),
    );
  });
});

describe('POST /api/auth/password/reset', () => {
  it('requires a token and password', async () => {
    const response = await request(app).post('/api/auth/password/reset').send({ token: 'abc' });

    expect(response.status).toBe(422);
    expect(resetPasswordMock).not.toHaveBeenCalled();
  });

  it('passes the payload to the auth service', async () => {
    const response = await request(app)
      .post('/api/auth/password/reset')
      .set('User-Agent', 'jest-agent')
      .send({ token: 'reset-token', password: 'StrongPass123!' });

    expect(response.status).toBe(200);
    expect(resetPasswordMock).toHaveBeenCalledWith(
      'reset-token',
      'StrongPass123!',
      expect.objectContaining({
        context: expect.objectContaining({
          ipAddress: expect.any(String),
          userAgent: 'jest-agent',
        }),
      }),
    );
    expect(response.body).toEqual({ session: { accessToken: 'reset', refreshToken: 'reset-refresh' } });
  });
});

describe('POST /api/auth/refresh', () => {
  it('requires a refresh token', async () => {
    const response = await request(app).post('/api/auth/refresh').send({});

    expect(response.status).toBe(422);
    expect(refreshSessionMock).not.toHaveBeenCalled();
  });

  it('normalises the refresh token and forwards context metadata', async () => {
    const response = await request(app)
      .post('/api/auth/refresh')
      .set('User-Agent', 'jest-test')
      .send({ refreshToken: '   valid-token   ' });

    expect(response.status).toBe(200);
    expect(refreshSessionMock).toHaveBeenCalledWith(
      'valid-token',
      expect.objectContaining({
        context: expect.objectContaining({
          ipAddress: expect.any(String),
          userAgent: 'jest-test',
        }),
      }),
    );
    expect(response.body).toEqual({
      session: {
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
        user: { id: 1 },
      },
    });
  });
});
