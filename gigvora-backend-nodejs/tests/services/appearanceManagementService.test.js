import { beforeEach, describe, expect, it } from '@jest/globals';
import {
  getAppearanceSummary,
  createTheme,
} from '../../src/services/appearanceManagementService.js';
import {
  AppearanceTheme,
  AppearanceAsset,
  AppearanceLayout,
} from '../../src/models/appearanceModels.js';

async function resetTables() {
  await AppearanceAsset.sync({ force: true });
  await AppearanceLayout.sync({ force: true });
  await AppearanceTheme.sync({ force: true });
}

describe('appearanceManagementService', () => {
  beforeEach(async () => {
    await resetTables();
  });

  it('aggregates themes, assets, and layouts into the admin summary snapshot', async () => {
    const theme = await AppearanceTheme.create({
      slug: 'daybreak',
      name: 'Daybreak',
      description: 'Default Gigvora shell',
      status: 'active',
      isDefault: true,
      tokens: { colors: { primary: '#2563EB' } },
      accessibility: { minimumContrastRatio: 4.5 },
    });

    await AppearanceAsset.bulkCreate([
      {
        themeId: theme.id,
        type: 'logo_light',
        label: 'Daybreak light wordmark',
        url: 'https://cdn.gigvora.dev/assets/daybreak/logo-light.svg',
        altText: 'Gigvora logotype',
        metadata: {},
        allowedRoles: [],
        status: 'active',
        isPrimary: true,
        sortOrder: 0,
      },
      {
        themeId: theme.id,
        type: 'hero',
        label: 'Daybreak hero background',
        url: 'https://cdn.gigvora.dev/assets/daybreak/hero.png',
        altText: 'Gradient hero background',
        metadata: {},
        allowedRoles: [],
        status: 'active',
        isPrimary: false,
        sortOrder: 1,
      },
    ]);

    await AppearanceLayout.create({
      themeId: theme.id,
      name: 'Marketing hero',
      slug: 'marketing-hero',
      page: 'marketing',
      status: 'published',
      version: 1,
      config: { modules: [{ id: 'hero', type: 'hero', title: 'Hero' }] },
      allowedRoles: [],
      metadata: {},
      releaseNotes: 'Baseline layout',
    });

    const summary = await getAppearanceSummary();

    expect(summary.stats.totalThemes).toBe(1);
    expect(summary.stats.defaultThemeId).toEqual(theme.id);
    expect(summary.stats.totalAssets).toBe(2);
    expect(summary.stats.publishedLayouts).toBe(1);
    expect(summary.themes).toHaveLength(1);
    expect(summary.themes[0].stats.assetCount).toBe(2);
    expect(summary.themes[0].stats.layoutCount).toBe(1);
    expect(summary.assets).toHaveLength(2);
    expect(summary.layouts).toHaveLength(1);
  });

  it('sanitises tokens and revokes previous defaults when creating a new default theme', async () => {
    const existing = await AppearanceTheme.create({
      slug: 'existing-default',
      name: 'Existing default',
      status: 'active',
      isDefault: true,
      tokens: {},
      accessibility: {},
    });

    const created = await createTheme(
      {
        name: 'New Showcase',
        slug: 'New Showcase',
        isDefault: true,
        tokens: {
          colors: { primary: '2563eb' },
          layout: { borderRadius: 200 },
        },
      },
      { actorId: 42 },
    );

    const refreshedExisting = await AppearanceTheme.findByPk(existing.id);

    expect(created.slug).toBe('new-showcase');
    expect(created.isDefault).toBe(true);
    expect(created.tokens.colors.primary).toBe('#2563eb');
    expect(created.tokens.layout.borderRadius).toBe(48);
    expect(created.createdBy).toBe(42);
    expect(refreshedExisting.isDefault).toBe(false);
  });
});
