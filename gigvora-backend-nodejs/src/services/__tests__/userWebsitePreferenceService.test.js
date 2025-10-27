import { afterEach, beforeAll, describe, expect, it, jest } from '@jest/globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

beforeAll(() => {
  process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
});

afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resolveModule = (specifier) => {
  if (!specifier.startsWith('.') && !specifier.startsWith('/')) {
    return specifier;
  }
  return path.resolve(__dirname, specifier);
};

const withDefaultExport = (factory) => () => {
  const exports = factory();
  return Object.prototype.hasOwnProperty.call(exports, 'default') ? exports : { default: exports, ...exports };
};

const mockErrors = () => ({
  ValidationError: class ValidationError extends Error {},
  NotFoundError: class NotFoundError extends Error {},
});

describe('userWebsitePreferenceService', () => {
  it('returns defaults with personalization when no record exists', async () => {
    const models = {
      User: { findByPk: jest.fn() },
      UserWebsitePreference: {
        findOne: jest.fn().mockResolvedValue(null),
      },
    };

    jest.unstable_mockModule(resolveModule('../../models/index.js'), withDefaultExport(() => models));
    jest.unstable_mockModule(resolveModule('../../utils/errors.js'), withDefaultExport(mockErrors));

    const { getUserWebsitePreferences } = await import('../userWebsitePreferenceService.js');

    const payload = await getUserWebsitePreferences(7);

    expect(models.UserWebsitePreference.findOne).toHaveBeenCalledWith({ where: { userId: 7 } });
    expect(payload.settings.siteTitle).toBe('My site');
    expect(payload.personalization.theme.preset).toBe('aurora');
    expect(payload.personalization.layout.modules).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'hero', pinned: true })]),
    );
    expect(payload.personalization.subscriptions.channels.email).toBe(true);
    expect(payload.personalization.subscriptions.categories.length).toBeGreaterThan(0);
    expect(payload.personalization.accessibility.altText.enforcement).toBe('required');
    expect(payload.personalization.accessibility.media.captionPolicy).toBe('required');
  });

  it('sanitizes and persists personalization payloads', async () => {
    let storedPayload;
    const preferenceRecord = {
      set: jest.fn((value) => {
        storedPayload = value;
      }),
      save: jest.fn().mockResolvedValue(undefined),
      reload: jest.fn().mockImplementation(async () => ({
        toPublicObject: () => ({
          id: 42,
          userId: 9,
          settings: storedPayload.settings,
          theme: storedPayload.theme,
          hero: storedPayload.hero,
          about: storedPayload.about,
          navigation: storedPayload.navigation,
          services: storedPayload.services,
          testimonials: storedPayload.testimonials,
          gallery: storedPayload.gallery,
          contact: storedPayload.contact,
          seo: storedPayload.seo,
          social: storedPayload.social,
          personalization: {
            theme: storedPayload.personalizationTheme,
            layout: storedPayload.personalizationLayout,
            subscriptions: storedPayload.personalizationSubscriptions,
            accessibility: storedPayload.personalizationAccessibility,
          },
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        }),
      })),
    };

    const models = {
      User: {
        findByPk: jest.fn().mockResolvedValue({ id: 9 }),
      },
      UserWebsitePreference: {
        findOne: jest.fn(),
        findOrCreate: jest.fn().mockResolvedValue([preferenceRecord, false]),
      },
    };

    jest.unstable_mockModule(resolveModule('../../models/index.js'), withDefaultExport(() => models));
    jest.unstable_mockModule(resolveModule('../../utils/errors.js'), withDefaultExport(mockErrors));

    const { updateUserWebsitePreferences } = await import('../userWebsitePreferenceService.js');

    const result = await updateUserWebsitePreferences(9, {
      personalization: {
        theme: {
          preset: 'obsidian',
          mode: 'dark',
          accent: 'custom',
          customAccent: '#12ab9f',
          customNeutral: '0f172a',
          livePreview: false,
          analyticsOptIn: 'true',
        },
        layout: {
          template: 'publisher',
          heroStyle: 'editorial',
          modules: [
            { id: 'hero', enabled: false, span: 'half' },
            { id: 'newsletter', enabled: true, span: 'third' },
          ],
          featuredCallout: '  Showcase expertise with editorial flow.  ',
          analyticsEnabled: 'yes',
        },
        subscriptions: {
          digestFrequency: 'monthly',
          timezone: 'europe/london',
          channels: { email: 0, push: '1', inApp: true, sms: 'false' },
          aiSummaries: '1',
          previewEnabled: 'on',
          categories: [
            { id: 'capital', enabled: 'true', frequency: 'real-time', channel: 'email' },
          ],
        },
        accessibility: {
          altText: { enforcement: 'recommended', autoGenerate: 'false', requireForMedia: 'yes' },
          media: {
            captionPolicy: 'preferred',
            transcripts: 'true',
            audioDescription: 'full',
          },
          content: { readingStyle: 'technical', inclusiveLanguage: 'on', plainLanguage: 0 },
          localisation: {
            autoTranslate: '1',
            languages: ['en', 'fr', 'xx', 12],
            defaultLanguage: 'fr',
            signLanguage: 'asl',
          },
          compliance: {
            contrast: 'false',
            focus: 'true',
            keyboard: 'yes',
            owner: '  Accessibility Council  ',
            lastReviewedAt: '2024-03-01T12:00:00Z',
          },
        },
      },
    });

    expect(models.User.findByPk).toHaveBeenCalledWith(9);
    const [payloadArg] = preferenceRecord.set.mock.calls[0];

    expect(payloadArg.personalizationTheme).toEqual(
      expect.objectContaining({
        preset: 'obsidian',
        mode: 'dark',
        accent: 'custom',
        customAccent: '#12AB9F',
        customNeutral: '#0F172A',
        livePreview: false,
        analyticsOptIn: true,
      }),
    );

    const heroModule = payloadArg.personalizationLayout.modules.find((module) => module.id === 'hero');
    expect(heroModule.enabled).toBe(true);
    expect(heroModule.pinned).toBe(true);
    expect(payloadArg.personalizationLayout.template).toBe('publisher');
    expect(payloadArg.personalizationLayout.analyticsEnabled).toBe(true);

    expect(payloadArg.personalizationSubscriptions.digestFrequency).toBe('monthly');
    expect(payloadArg.personalizationSubscriptions.channels).toEqual(
      expect.objectContaining({ email: false, push: true, inApp: true, sms: false }),
    );
    expect(payloadArg.personalizationSubscriptions.categories).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'capital', frequency: 'real-time' })]),
    );
    expect(payloadArg.personalizationAccessibility).toEqual(
      expect.objectContaining({
        altText: expect.objectContaining({ enforcement: 'recommended', autoGenerate: false }),
        media: expect.objectContaining({ captionPolicy: 'preferred', audioDescription: 'full' }),
        content: expect.objectContaining({ readingStyle: 'technical', plainLanguage: false }),
        localisation: expect.objectContaining({ defaultLanguage: 'fr', languages: ['en', 'fr'] }),
        compliance: expect.objectContaining({
          contrast: false,
          focus: true,
          keyboard: true,
          owner: 'Accessibility Council',
        }),
      }),
    );

    expect(preferenceRecord.save).toHaveBeenCalled();

    expect(result.personalization.theme.preset).toBe('obsidian');
    expect(result.personalization.layout.template).toBe('publisher');
    expect(result.personalization.subscriptions.channels.push).toBe(true);
    expect(result.personalization.accessibility.media.captionPolicy).toBe('preferred');
    expect(result.personalization.accessibility.localisation.languages).toEqual(['en', 'fr']);
  });
});
