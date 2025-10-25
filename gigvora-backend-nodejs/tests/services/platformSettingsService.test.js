import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import {
  getPlatformSettings,
  updatePlatformSettings,
  getHomepageSettings,
  updateHomepageSettings,
  listPlatformSettingsAuditEvents,
} from '../../src/services/platformSettingsService.js';
import { PlatformSetting } from '../../src/models/platformSetting.js';
import { PlatformSettingsAuditEvent } from '../../src/models/platformSettingsAuditEvent.js';
import { ValidationError } from '../../src/utils/errors.js';
import { isEncryptedSecret } from '../../src/utils/secretStorage.js';

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
    await PlatformSettingsAuditEvent.sync({ force: true });
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
    expect(settings.homepage.hero.title).toContain('Build resilient');
    expect(settings.homepage.quickLinks.length).toBeGreaterThan(0);
    expect(settings.documentation.sections.payments).toBeDefined();
    expect(settings.metadata.sensitiveFields).toContain('payments.stripe.secretKey');
    expect(settings.metadata.updatedAt).toBeNull();
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
    expect(updated.metadata.version).toEqual(expect.any(String));
    expect(updated.metadata.sensitiveFields).toContain('payments.escrow_com.apiSecret');
    expect(
      updated.documentation.sections.payments.fields['payments.provider'].i18nKey,
    ).toBe('platform.settings.fields.payments.provider');
    expect(updated.metadata.updatedAt).toEqual(expect.any(String));
    expect(updated.documentation.sections.payments.fields['payments.escrow_com.apiSecret']).toMatchObject({ sensitive: true });

    const record = await PlatformSetting.findOne({ where: { key: 'platform' } });
    expect(record).not.toBeNull();
    expect(isEncryptedSecret(record.value.payments.escrow_com.apiSecret)).toBe(true);
    expect(isEncryptedSecret(record.value.smtp.password)).toBe(true);

    const fetched = await getPlatformSettings();
    expect(fetched.subscriptions.enabled).toBe(false);
    expect(fetched.payments.provider).toBe('escrow_com');
    expect(fetched.payments.escrow_com.apiSecret).toBe('escrow-secret');
    expect(fetched.smtp.password).toBe('supersecret');
    expect(fetched.storage.cloudflare_r2.publicBaseUrl).toBe('https://cdn.gigvora.dev');
    expect(fetched.homepage.hero.title).toContain('Build resilient');

    const auditLog = await listPlatformSettingsAuditEvents();
    expect(auditLog.total).toBeGreaterThan(0);
    expect(auditLog.events[0].summary.toLowerCase()).toContain('payment');
    const secretChange = auditLog.events[0].changes.find(
      (change) => change.path === 'payments.escrow_com.apiSecret',
    );
    expect(secretChange).toMatchObject({ type: 'secret', action: 'set' });
    expect(secretChange.beforeFingerprint).toBeNull();
    expect(secretChange.afterFingerprint).toEqual(expect.any(String));
  });

  it('throws when commission percentages exceed policy boundaries', async () => {
    await expect(
      updatePlatformSettings({ commissions: { rate: 120 } }),
    ).rejects.toBeInstanceOf(ValidationError);

    await expect(
      updatePlatformSettings({ commissions: { rate: 80, servicemanMinimumRate: 40 } }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('requires escrow credentials when enabling escrow provider', async () => {
    await expect(
      updatePlatformSettings({ payments: { provider: 'escrow_com', escrow_com: { apiKey: '', apiSecret: '' } } }),
    ).rejects.toThrow('Escrow.com API key and secret are required when Escrow.com is the active payment provider.');
  });

  it('preserves encrypted secrets when unrelated updates occur', async () => {
    await updatePlatformSettings({
      payments: { provider: 'escrow_com', escrow_com: { apiKey: 'escrow-key', apiSecret: 'escrow-secret' } },
      smtp: { password: 'initial-password' },
    });

    const firstRecord = await PlatformSetting.findOne({ where: { key: 'platform' } });
    const initialEscrowCipher = firstRecord.value.payments.escrow_com.apiSecret;
    const initialSmtpCipher = firstRecord.value.smtp.password;

    await updatePlatformSettings({ commissions: { rate: 6.25 } });

    const secondRecord = await PlatformSetting.findOne({ where: { key: 'platform' } });
    expect(secondRecord.value.payments.escrow_com.apiSecret).toBe(initialEscrowCipher);
    expect(secondRecord.value.smtp.password).toBe(initialSmtpCipher);

    const auditLog = await listPlatformSettingsAuditEvents({ limit: 1 });
    const latestChanges = auditLog.events[0].changes.map((change) => change.path);
    expect(latestChanges).not.toContain('payments.escrow_com.apiSecret');
    expect(latestChanges).not.toContain('smtp.password');
  });

  it('filters audit events by actor and changed sections', async () => {
    await updatePlatformSettings(
      { payments: { provider: 'stripe', stripe: { secretKey: 'rotated', publishableKey: 'pk_test' } } },
      { actorId: 12, actorEmail: 'admin@gigvora.com', actorName: 'Admin Example' },
    );

    await updatePlatformSettings(
      { commissions: { rate: 6.5 } },
      { actorId: 34, actorEmail: 'ops@gigvora.com', actorName: 'Ops Reviewer' },
    );

    const byActor = await listPlatformSettingsAuditEvents({ actorId: 12 });
    expect(byActor.events.length).toBeGreaterThan(0);
    expect(byActor.events.every((event) => event.actorId === 12)).toBe(true);

    const byEmail = await listPlatformSettingsAuditEvents({ actorEmail: 'ops@gigvora.com' });
    expect(byEmail.events.length).toBeGreaterThan(0);
    expect(byEmail.events[0].actorEmail).toBe('ops@gigvora.com');

    const paymentsEvents = await listPlatformSettingsAuditEvents({ sections: ['payments'] });
    expect(paymentsEvents.events.length).toBeGreaterThan(0);
    expect(paymentsEvents.events.every((event) => event.changedSections.includes('payments'))).toBe(true);

    const limited = await listPlatformSettingsAuditEvents({ limit: 1, sections: ['payments'] });
    expect(limited.events).toHaveLength(1);
  });

  describe('homepage settings', () => {
    it('returns homepage defaults when none persisted', async () => {
      const homepage = await getHomepageSettings();

      expect(homepage.announcementBar.enabled).toBe(true);
      expect(homepage.hero.stats).toHaveLength(4);
      expect(homepage.valueProps.length).toBeGreaterThan(0);
    });

    it('normalizes and persists homepage updates', async () => {
      const updated = await updateHomepageSettings({
        announcementBar: {
          enabled: false,
          message: 'Welcome to the new control tower',
          ctaLabel: 'View changelog',
          ctaHref: '/blog',
        },
        hero: {
          title: 'Operate with confidence',
          subtitle: 'Every workflow, policy, and partner in one secure surface.',
          primaryCtaLabel: 'Launch workspace',
          primaryCtaHref: '/login',
          overlayOpacity: 0.33,
          stats: [
            { id: 'launches', label: 'Launches this quarter', value: '42', suffix: '+' },
            { label: 'Automations deployed', value: 12 },
          ],
        },
        valueProps: [
          {
            id: 'ops',
            title: 'Operations ready',
            description: 'Provision squads with automated guardrails.',
            ctaHref: '/dashboard/admin',
          },
        ],
        featureSections: [
          {
            title: 'Preview homepage blocks',
            description: 'Compose hero, highlights, and proof in minutes.',
            bullets: [
              { text: 'Drag-and-drop order management' },
              { text: 'Role-gated publishing approvals' },
            ],
          },
        ],
        testimonials: [
          {
            quote: 'Publishing updates is now a two-minute workflow.',
            authorName: 'Jamie Rivera',
          },
        ],
        faqs: [
          { question: 'Can we hide the announcement bar?', answer: 'Yes—toggle it off in the dashboard.' },
        ],
        quickLinks: [
          { label: 'Open live site', href: '/', target: '_blank' },
        ],
        seo: {
          title: 'Gigvora Homepage',
          description: 'Curate the first impression with automated governance.',
          keywords: ['gigvora', 'homepage'],
          ogImageUrl: 'https://cdn.gigvora.com/assets/og/updated-home.png',
        },
      });

      expect(updated.hero.title).toBe('Operate with confidence');
      expect(updated.hero.stats[0].value).toBe(42);
      expect(updated.hero.stats[0].suffix).toBe('+');
      expect(updated.valueProps[0].title).toBe('Operations ready');
      expect(updated.featureSections[0].bullets).toHaveLength(2);
      expect(updated.quickLinks[0].target).toBe('_blank');

      const fetched = await getHomepageSettings();
      expect(fetched.hero.title).toBe('Operate with confidence');
      expect(fetched.announcementBar.enabled).toBe(false);
      expect(fetched.seo.title).toBe('Gigvora Homepage');
    });
  });
});
