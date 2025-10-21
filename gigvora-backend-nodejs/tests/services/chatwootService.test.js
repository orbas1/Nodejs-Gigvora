import { jest } from '@jest/globals';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

describe('chatwootService', () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const messagingModelsModulePath = pathToFileURL(path.resolve(__dirname, '../../src/models/messagingModels.js')).pathname;
  const runtimeConfigModulePath = pathToFileURL(path.resolve(__dirname, '../../src/config/runtimeConfig.js')).pathname;
  const cacheModulePath = pathToFileURL(path.resolve(__dirname, '../../src/utils/cache.js')).pathname;
  const loggerModulePath = pathToFileURL(path.resolve(__dirname, '../../src/utils/logger.js')).pathname;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('returns disabled widget payload when Chatwoot is not configured', async () => {
    await jest.unstable_mockModule(messagingModelsModulePath, () => ({
      sequelize: { transaction: jest.fn() },
      MessageThread: {},
      MessageParticipant: {},
      Message: {},
      MessageAttachment: {},
      SupportCase: {},
      User: { findByPk: jest.fn() },
    }));

    await jest.unstable_mockModule(runtimeConfigModulePath, () => ({
      getRuntimeConfig: () => ({ support: { chatwoot: { enabled: false } } }),
    }));

    await jest.unstable_mockModule(cacheModulePath, () => ({
      appCache: { flushByPrefix: jest.fn(), delete: jest.fn() },
    }));

    await jest.unstable_mockModule(loggerModulePath, () => ({
      default: { child: () => ({ warn: jest.fn(), debug: jest.fn(), info: jest.fn(), error: jest.fn() }) },
    }));

    const { isChatwootEnabled, getWidgetSettingsForUser } = await import('../../src/services/chatwootService.js');

    expect(isChatwootEnabled()).toBe(false);
    const settings = await getWidgetSettingsForUser(1, {});
    expect(settings.enabled).toBe(false);
  });

  it('hydrates widget payload with hashed identifier and memberships', async () => {
    const userRecord = {
      id: 23,
      firstName: 'Sam',
      lastName: 'Rivera',
      email: 'sam@gigvora.com',
      userType: 'freelancer',
      memberships: JSON.stringify(['freelancer', 'mentor']),
      primaryDashboard: 'freelancer',
      avatarUrl: 'https://cdn.example/avatar.png',
      status: 'active',
      location: 'Lisbon',
      lastSeenAt: new Date('2023-12-30T10:00:00Z'),
    };

    await jest.unstable_mockModule(messagingModelsModulePath, () => ({
      sequelize: { transaction: jest.fn() },
      MessageThread: {},
      MessageParticipant: {},
      Message: {},
      MessageAttachment: {},
      SupportCase: {},
      User: { findByPk: jest.fn().mockResolvedValue(userRecord) },
    }));

    const config = {
      support: {
        chatwoot: {
          enabled: true,
          baseUrl: 'https://chatwoot.example',
          websiteToken: 'site-token',
          hmacToken: 'hmac-secret',
          portalToken: 'portal-token',
        },
      },
    };

    await jest.unstable_mockModule(runtimeConfigModulePath, () => ({
      getRuntimeConfig: () => config,
    }));

    await jest.unstable_mockModule(cacheModulePath, () => ({
      appCache: { flushByPrefix: jest.fn(), delete: jest.fn() },
    }));

    await jest.unstable_mockModule(loggerModulePath, () => ({
      default: { child: () => ({ warn: jest.fn(), debug: jest.fn(), info: jest.fn(), error: jest.fn() }) },
    }));

    const { getWidgetSettingsForUser } = await import('../../src/services/chatwootService.js');

    const payload = await getWidgetSettingsForUser('23');

    const expectedIdentifier = `gigvora-user-${userRecord.id}`;
    const expectedHash = crypto.createHmac('sha256', 'hmac-secret').update(expectedIdentifier).digest('hex');

    expect(payload.enabled).toBe(true);
    expect(payload.secureMode.identifier).toBe(expectedIdentifier);
    expect(payload.secureMode.identifierHash).toBe(expectedHash);
    expect(payload.customAttributes.memberships).toEqual(['freelancer', 'mentor']);
    expect(payload.locale).toBe('en');
  });

  it('skips webhook processing when conversation lacks a Gigvora user identifier', async () => {
    const transactionSpy = jest.fn();

    await jest.unstable_mockModule(messagingModelsModulePath, () => ({
      sequelize: { transaction: transactionSpy },
      MessageThread: { findOne: jest.fn() },
      MessageParticipant: { findAll: jest.fn() },
      Message: { findOne: jest.fn(), create: jest.fn() },
      MessageAttachment: { bulkCreate: jest.fn() },
      SupportCase: { findOne: jest.fn() },
      User: { findByPk: jest.fn(), findOne: jest.fn() },
    }));

    const runtimeConfig = {
      support: {
        chatwoot: {
          enabled: true,
          baseUrl: 'https://chatwoot.example',
          websiteToken: 'site-token',
          webhookToken: 'webhook-secret',
        },
      },
    };

    await jest.unstable_mockModule(runtimeConfigModulePath, () => ({
      getRuntimeConfig: () => runtimeConfig,
    }));

    await jest.unstable_mockModule(cacheModulePath, () => ({
      appCache: { flushByPrefix: jest.fn(), delete: jest.fn() },
    }));

    await jest.unstable_mockModule(loggerModulePath, () => ({
      default: { child: () => ({ warn: jest.fn(), debug: jest.fn(), info: jest.fn(), error: jest.fn() }) },
    }));

    const { processWebhookEvent } = await import('../../src/services/chatwootService.js');

    const payload = {
      id: 555,
      status: 'open',
      additional_attributes: {},
      meta: {},
      contact: { custom_attributes: {} },
    };

    const rawBody = JSON.stringify({ event: 'conversation_created', conversation: payload });
    const signature = crypto.createHmac('sha256', 'webhook-secret').update(rawBody).digest('hex');

    const result = await processWebhookEvent({
      signature,
      eventName: 'conversation_created',
      payload: { payload: { event: 'conversation_created', conversation: payload } },
      rawBody,
    });

    expect(result).toEqual({ ignored: true });
    expect(transactionSpy).not.toHaveBeenCalled();
  });
});
