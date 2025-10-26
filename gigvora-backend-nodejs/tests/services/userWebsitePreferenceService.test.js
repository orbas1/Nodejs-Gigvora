import { beforeEach, describe, expect, it, jest } from '@jest/globals';

let updateUserWebsitePreferences;
let getUserWebsitePreferences;
let User;
let UserWebsitePreference;
let persisted;

beforeEach(async () => {
  jest.resetModules();
  jest.clearAllMocks();
  process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
  persisted = null;

  await jest.unstable_mockModule('../../src/models/index.js', () => {
    User = {
      findByPk: jest.fn().mockImplementation(async (id) => ({ id })),
    };

    UserWebsitePreference = {
      findOrCreate: jest.fn(async ({ defaults }) => {
        persisted = defaults;
        return [
          {
            toPublicObject: () => ({ id: 1, userId: defaults.userId ?? 1, ...defaults }),
            reload: jest.fn().mockResolvedValue({
              toPublicObject: () => ({ id: 1, userId: defaults.userId ?? 1, ...persisted }),
            }),
            set: jest.fn((updates) => {
              persisted = updates;
            }),
            save: jest.fn(),
          },
          true,
        ];
      }),
      findOne: jest.fn(async () => {
        if (!persisted) {
          return null;
        }
        return {
          toPublicObject: () => ({ id: 1, userId: 1, ...persisted }),
        };
      }),
    };

    return { User, UserWebsitePreference };
  });

  ({ updateUserWebsitePreferences, getUserWebsitePreferences } = await import(
    '../../src/services/userWebsitePreferenceService.js'
  ));
});

describe('userWebsitePreferenceService', () => {
  it('sanitizes theme fields and content subscriptions before persisting', async () => {
    const saved = await updateUserWebsitePreferences(1, {
      theme: {
        accentPalette: ['#123456', '123456', 'invalid', '#123456'],
        accessibilityPreset: 'high-contrast',
        systemSync: 'false',
        reduceMotion: 'true',
        presetId: ' midnight-neon ',
        lastSyncedAt: '2025-03-01T12:30:00.000Z',
      },
      subscriptions: {
        digestTime: 'friday-16:00',
        autoPersonalize: '0',
        modules: [
          {
            id: 'spotlight',
            title: 'Spotlight digest',
            enabled: 'true',
            frequency: 'weekly',
            channels: ['site', 'sms'],
            segments: ['prospects', 'unknown'],
            sampleContent: [
              { id: '', title: 'Creator takeover', metric: '500 reads' },
            ],
          },
        ],
      },
    });

    expect(User.findByPk).toHaveBeenCalledWith(1);
    expect(UserWebsitePreference.findOrCreate).toHaveBeenCalled();
    expect(saved.theme.accentPalette).toEqual(['#123456']);
    expect(saved.theme.accessibilityPreset).toBe('high-contrast');
    expect(saved.theme.systemSync).toBe(false);
    expect(saved.theme.reduceMotion).toBe(true);
    expect(saved.theme.presetId).toBe('midnight-neon');
    expect(saved.theme.lastSyncedAt).toBe('2025-03-01T12:30:00.000Z');

    expect(saved.subscriptions.digestTime).toBe('friday-16:00');
    expect(saved.subscriptions.autoPersonalize).toBe(false);
    expect(saved.subscriptions.modules).toHaveLength(1);
    const module = saved.subscriptions.modules[0];
    expect(module.channels).toEqual(['site']);
    expect(module.segments).toEqual(['prospects']);
    expect(module.sampleContent).toHaveLength(1);
    expect(typeof module.sampleContent[0].id).toBe('string');
    expect(module.sampleContent[0].id.length).toBeGreaterThan(0);

    const refreshed = await getUserWebsitePreferences(1);
    expect(refreshed.theme.systemSync).toBe(false);
    expect(refreshed.subscriptions.modules[0].channels).toEqual(['site']);
    expect(refreshed.subscriptions.modules[0].segments).toEqual(['prospects']);
  });
});
