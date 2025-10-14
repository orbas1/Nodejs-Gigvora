import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { getPlatformSettings, updatePlatformSettings } from '../../src/services/platformSettingsService.js';
import { PlatformSetting } from '../../src/models/platformSetting.js';
import { ValidationError } from '../../src/utils/errors.js';

let originalEnv;

beforeEach(() => {
  originalEnv = { ...process.env };
});

afterEach(() => {
  Object.keys(process.env).forEach((key) => {
    if (!(key in originalEnv)) {
      delete process.env[key];
    }
  });
  Object.assign(process.env, originalEnv);
});

describe('platformSettingsService', () => {
  beforeEach(async () => {
    await PlatformSetting.sync({ force: true });
  });

  it('returns environment-derived defaults when no override exists', async () => {
    process.env.PLATFORM_COMMISSIONS_ENABLED = 'false';
    process.env.PLATFORM_COMMISSION_RATE = '18.75';
    process.env.PLATFORM_PROVIDER_CONTROLS_SERVICEMAN_PAY = 'false';
    process.env.PLATFORM_SERVICEMAN_MINIMUM_RATE = '15.5';
    process.env.PLATFORM_SERVICEMAN_PAYOUT_NOTES = 'Providers must pay field teams directly.';
    process.env.PLATFORM_SUBSCRIPTION_RESTRICTED_FEATURES = 'premium-support,advanced-analytics';
    process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_default';
    process.env.CLOUDFLARE_R2_BUCKET = 'gigvora-dev-bucket';

    const settings = await getPlatformSettings();

    expect(settings.commissions.enabled).toBe(false);
    expect(settings.commissions.rate).toBe(18.75);
    expect(settings.commissions.providerControlsServicemanPay).toBe(false);
    expect(settings.commissions.servicemanMinimumRate).toBe(15.5);
    expect(settings.commissions.servicemanPayoutNotes).toBe('Providers must pay field teams directly.');
    expect(settings.subscriptions.restrictedFeatures).toEqual([
      'premium-support',
      'advanced-analytics',
    ]);
    expect(settings.payments.provider).toBe('stripe');
    expect(settings.storage.cloudflare_r2.bucket).toBe('gigvora-dev-bucket');
    expect(settings.smtp.port).toBe(587);
  });

  it('normalizes and persists administrative updates', async () => {
    const updated = await updatePlatformSettings({
      commissions: {
        enabled: true,
        rate: '12.5',
        currency: 'USD',
        minimumFee: '5',
        providerControlsServicemanPay: true,
        servicemanMinimumRate: '25',
        servicemanPayoutNotes: 'Providers manage servicemen compensation per engagement.',
      },
      subscriptions: {
        enabled: false,
        restrictedFeatures: ['advanced-analytics'],
        plans: [
          {
            id: 'pro-plan',
            name: 'Pro Plan',
            price: '29.99',
            interval: 'monthly',
            restrictedFeatures: ['priority-support', 'priority-support'],
            trialDays: 14,
          },
        ],
      },
      payments: {
        provider: 'escrow_com',
        escrow_com: { apiKey: 'escrow-key', apiSecret: 'escrow-secret', sandbox: false },
      },
      smtp: {
        host: 'smtp.gigvora.dev',
        port: 465,
        secure: true,
        username: 'mailer',
        password: 'supersecret',
        fromAddress: 'team@gigvora.dev',
        fromName: 'GigVora Team',
      },
      storage: {
        provider: 'cloudflare_r2',
        cloudflare_r2: {
          accountId: 'acc123',
          accessKeyId: 'key123',
          secretAccessKey: 'secret123',
          bucket: 'gigvora-live',
          endpoint: 'https://account-id.r2.cloudflarestorage.com',
          publicBaseUrl: 'https://cdn.gigvora.dev',
        },
      },
      featureToggles: {
        commissions: true,
        subscriptions: false,
        escrow: true,
      },
    });

    expect(updated.commissions.rate).toBe(12.5);
    expect(updated.commissions.minimumFee).toBe(5);
    expect(updated.commissions.servicemanMinimumRate).toBe(25);
    expect(updated.commissions.providerControlsServicemanPay).toBe(true);
    expect(updated.commissions.servicemanPayoutNotes).toBe(
      'Providers manage servicemen compensation per engagement.',
    );
    expect(updated.subscriptions.enabled).toBe(false);
    expect(updated.subscriptions.plans).toHaveLength(1);
    expect(updated.subscriptions.plans[0].id).toBe('pro-plan');
    expect(updated.subscriptions.plans[0].restrictedFeatures).toEqual(['priority-support']);
    expect(updated.payments.provider).toBe('escrow_com');
    expect(updated.payments.escrow_com.sandbox).toBe(false);
    expect(updated.smtp.port).toBe(465);
    expect(updated.storage.cloudflare_r2.bucket).toBe('gigvora-live');
    expect(updated.featureToggles.subscriptions).toBe(false);

    const fetched = await getPlatformSettings();
    expect(fetched.subscriptions.enabled).toBe(false);
    expect(fetched.payments.provider).toBe('escrow_com');
    expect(fetched.storage.cloudflare_r2.publicBaseUrl).toBe('https://cdn.gigvora.dev');
  });

  it('throws when commission percentages exceed policy boundaries', async () => {
    await expect(
      updatePlatformSettings({ commissions: { rate: 120 } }),
    ).rejects.toBeInstanceOf(ValidationError);

    await expect(
      updatePlatformSettings({ commissions: { rate: 80, servicemanMinimumRate: 40 } }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
