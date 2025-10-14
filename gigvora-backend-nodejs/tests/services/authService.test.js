import { describe, it, expect, beforeEach, beforeAll } from '@jest/globals';
import bcrypt from 'bcrypt';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh';
process.env.NODE_ENV = 'test';

import authService from '../../src/services/authService.js';
import { User, TwoFactorToken, sequelize } from '../../src/models/index.js';

describe('authService', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  it('registers a user with hashed password and default 2FA settings', async () => {
    const payload = {
      email: 'person@example.com',
      password: 'supersecure',
      firstName: 'Avery',
      lastName: 'Taylor',
      userType: 'user',
    };

    const user = await authService.register(payload);
    expect(user).toMatchObject({
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      twoFactorEnabled: true,
      twoFactorMethod: 'email',
    });

    const stored = await User.findOne({ where: { email: payload.email } });
    expect(stored).not.toBeNull();
    expect(stored.twoFactorEnabled).toBe(true);
    expect(await bcrypt.compare(payload.password, stored.password)).toBe(true);
  });

  it('initiates and verifies a two factor challenge during login', async () => {
    const email = 'challenge@example.com';
    await authService.register({ email, password: 'complexpass', firstName: 'Jamie', lastName: 'Stone' });

    const loginResult = await authService.login(email, 'complexpass');
    expect(loginResult.requiresTwoFactor).toBe(true);
    expect(loginResult.challenge.tokenId).toBeDefined();
    expect(loginResult.challenge.maskedDestination).toContain('@');

    const tokenRecord = await TwoFactorToken.findByPk(loginResult.challenge.tokenId);
    expect(tokenRecord).not.toBeNull();

    const verifyResult = await authService.verifyTwoFactor(
      email,
      loginResult.challenge.debugCode,
      loginResult.challenge.tokenId,
    );

    expect(verifyResult.session.accessToken).toBeDefined();
    expect(verifyResult.session.refreshToken).toBeDefined();
    expect(verifyResult.session.user.email).toBe(email);
  });

  it('skips two factor when disabled for the account', async () => {
    const email = 'no2fa@example.com';
    await authService.register({
      email,
      password: 'verysecret',
      firstName: 'Morgan',
      lastName: 'Lee',
      twoFactorEnabled: false,
    });

    const loginResult = await authService.login(email, 'verysecret');
    expect(loginResult.requiresTwoFactor).toBe(false);
    expect(loginResult.session.accessToken).toBeDefined();
    expect(loginResult.session.user.email).toBe(email);
  });
});
