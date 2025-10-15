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

const authServiceModuleUrl = new URL('../../src/services/authService.js', import.meta.url);
const loggerModuleUrl = new URL('../../src/utils/logger.js', import.meta.url);

jest.unstable_mockModule(authServiceModuleUrl.pathname, () => ({
  default: {
    register: registerMock,
    login: loginMock,
    verifyTwoFactor: verifyTwoFactorMock,
    resendTwoFactor: resendTwoFactorMock,
    loginWithGoogle: googleLoginMock,
    refreshSession: refreshSessionMock,
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
});

describe('POST /api/auth/register', () => {
  it('rejects payloads missing required fields', async () => {
    const response = await request(app).post('/api/auth/register').send({ password: 'Secret123!' });

    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({
      message: 'Request validation failed.',
      details: { issues: expect.any(Array) },
    });
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
