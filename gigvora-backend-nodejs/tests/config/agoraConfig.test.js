process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';

import { ensureAgoraConfigured, getAgoraCredentials, getAgoraTokenTtl, getAgoraAppId } from '../../src/config/agora.js';

describe('agora configuration', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    Object.keys(process.env).forEach((key) => {
      delete process.env[key];
    });
    Object.assign(process.env, originalEnv);
  });

  test('ensureAgoraConfigured throws when credentials missing', () => {
    delete process.env.AGORA_APP_ID;
    delete process.env.AGORA_APP_CERTIFICATE;

    expect(() => ensureAgoraConfigured()).toThrow(/Agora credentials are not configured/);
  });

  test('returns credentials and token ttl when configured', () => {
    process.env.AGORA_APP_ID = 'test-app';
    process.env.AGORA_APP_CERTIFICATE = 'test-cert';
    process.env.AGORA_TOKEN_TTL = '7200';

    expect(() => ensureAgoraConfigured()).not.toThrow();
    expect(getAgoraCredentials()).toEqual({ appId: 'test-app', certificate: 'test-cert' });
    expect(getAgoraAppId()).toBe('test-app');
    expect(getAgoraTokenTtl()).toBe(7200);
  });

  test('token ttl falls back to default when invalid', () => {
    process.env.AGORA_APP_ID = 'default-app';
    process.env.AGORA_APP_CERTIFICATE = 'default-cert';
    process.env.AGORA_TOKEN_TTL = '-5';

    expect(getAgoraTokenTtl()).toBe(3600);
  });
});
