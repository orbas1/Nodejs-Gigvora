import { jest } from '@jest/globals';

import {
  configureDesignSystem,
  resetDesignSystem,
  getDesignSystemSnapshot,
  getRuntimeDesignTokens,
  getDesignSystemMetadata,
  __setDependencies,
  __resetDependencies,
} from '../designSystemService.js';

const themePayload = {
  id: 'theme-1',
  slug: 'gigvora-daybreak',
  name: 'Gigvora Daybreak',
  status: 'active',
  tokens: {
    colors: {
      background: '#ffffff',
      surface: '#f8fafc',
      primary: '#2563EB',
      accent: '#2563EB',
      accentStrong: '#1D4ED8',
      accentSoft: 'rgba(37, 99, 235, 0.12)',
      textPrimary: '#0F172A',
      textSecondary: '#475569',
    },
  },
  accessibility: { minimumContrastRatio: 4.8 },
  assets: [
    {
      id: 'asset-1',
      type: 'logo_light',
      label: 'Wordmark',
      url: 'https://cdn.gigvora.dev/assets/daybreak/logo-light.svg',
      altText: 'Gigvora logotype',
      metadata: { width: 320, height: 96 },
      sortOrder: 0,
      isPrimary: true,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    },
  ],
  componentProfiles: [
    {
      componentKey: 'buttonSuite',
      definition: {
        variants: {
          primary: { class: 'bg-indigo-600 text-white shadow-soft' },
        },
      },
      metadata: { version: '2025.05' },
      updatedAt: '2025-02-01T00:00:00.000Z',
    },
  ],
  updatedAt: '2025-02-01T00:00:00.000Z',
};

const mockThemeInstance = {
  toPublicObject: jest.fn(() => themePayload),
};

const mockAppearanceModels = {
  AppearanceTheme: {
    findOne: jest.fn(async () => mockThemeInstance),
  },
  AppearanceAsset: {},
  AppearanceComponentProfile: {},
};

function createReleaseModel() {
  const releases = [];
  return {
    state: releases,
    findOne: jest.fn(async () => {
      if (!releases.length) {
        return null;
      }
      const record = releases[releases.length - 1];
      return {
        get: () => ({ ...record }),
      };
    }),
    create: jest.fn(async (payload) => {
      const record = { id: `release-${releases.length + 1}`, ...payload };
      releases.push(record);
      return {
        get: () => ({ ...record }),
      };
    }),
  };
}

describe('designSystemService', () => {
  let releaseModel;
  const loggerStub = {
    child: jest.fn(() => ({ warn: jest.fn(), error: jest.fn() })),
  };

  beforeEach(() => {
    releaseModel = createReleaseModel();
    __setDependencies({
      appearanceModels: mockAppearanceModels,
      releaseModel,
      logger: loggerStub,
    });
    resetDesignSystem();
  });

  afterEach(() => {
    jest.clearAllMocks();
    __resetDependencies();
  });

  it('persists and returns a release-backed snapshot', async () => {
    const snapshot = await getDesignSystemSnapshot();

    expect(snapshot.version).toEqual(expect.any(String));
    expect(snapshot.metadata.theme.slug).toBe('gigvora-daybreak');
    expect(releaseModel.create).toHaveBeenCalledTimes(1);

    const secondSnapshot = await getDesignSystemSnapshot();
    expect(secondSnapshot.metadata.theme.slug).toBe('gigvora-daybreak');
    expect(releaseModel.create).toHaveBeenCalledTimes(1);
  });

  it('generates snapshots for custom preferences without creating new releases', async () => {
    await getDesignSystemSnapshot();
    const customised = await getDesignSystemSnapshot({ accent: 'emerald', density: 'compact' });

    expect(customised.preferences.accent).toBe('emerald');
    expect(customised.preferences.density).toBe('compact');
    expect(releaseModel.create).toHaveBeenCalledTimes(1);
  });

  it('returns runtime metadata and analytics derived from the release', async () => {
    await getDesignSystemSnapshot();

    const runtime = await getRuntimeDesignTokens({ mode: 'dark' });
    const metadata = await getDesignSystemMetadata();

    expect(runtime.runtime.colors.accent).toEqual(expect.any(String));
    expect(metadata.version).toEqual(expect.any(String));
    expect(metadata.analytics).toBeTruthy();
  });

  it('merges configuration overrides into release generation', async () => {
    configureDesignSystem({ mode: 'dark', releasedBy: 'qa-user' });
    const snapshot = await getDesignSystemSnapshot();

    expect(snapshot.preferences.mode).toBe('dark');
    expect(releaseModel.create).toHaveBeenCalledWith(expect.objectContaining({ releasedBy: 'qa-user' }));
  });
});
