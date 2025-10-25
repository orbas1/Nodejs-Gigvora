'use strict';

const crypto = require('crypto');
const { QueryTypes } = require('sequelize');

const SEED_KEY = 'appearance-style-baseline';
const THEME_SLUG = 'gigvora-daybreak';
const LAYOUT_SLUG = 'gigvora-daybreak-marketing-homepage';

const TOKENS = Object.freeze({
  colors: {
    primary: '#2563EB',
    secondary: '#0EA5E9',
    accent: '#F97316',
    surface: '#FFFFFF',
    background: '#F8FAFC',
    border: '#E2E8F0',
    muted: '#CBD5F5',
    success: '#059669',
    warning: '#D97706',
    danger: '#DC2626',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
  },
  typography: {
    headingFamily: 'Inter',
    bodyFamily: 'Inter',
    monospaceFamily: 'JetBrains Mono',
    baseFontSize: 16,
    lineHeight: 1.6,
    headingWeight: 600,
    bodyWeight: 400,
    tracking: 0,
  },
  layout: {
    borderRadius: 16,
    surfaceRadius: 24,
    sectionGutter: 72,
    cardSpacing: 24,
    containerWidth: 1200,
    gridColumns: 12,
  },
  components: {
    buttonShape: 'pill',
    buttonWeight: 'semibold',
    navStyle: 'floating',
    shadowStrength: 0.18,
    inputStyle: 'rounded',
  },
  imagery: {
    heroBackground: 'gradient:indigo-cyan',
    pattern: 'diagonal-lines',
    illustrationStyle: '3d',
  },
});

const ACCESSIBILITY = Object.freeze({
  minimumContrastRatio: 4.8,
  dyslexiaSafeFonts: true,
  reducedMotion: false,
  notes: 'Seed baseline ensures 4.5:1 contrast and supports reduced motion overrides from client preferences.',
});

function buildAsset({ id = crypto.randomUUID(), label, type, url, altText, metadata, sortOrder = 0, isPrimary = false }) {
  const now = new Date();
  return {
    id,
    label,
    type,
    url,
    altText,
    sortOrder,
    status: 'active',
    metadata: { seedKey: SEED_KEY, ...metadata },
    allowedRoles: [],
    isPrimary,
    createdAt: now,
    updatedAt: now,
  };
}

function buildLayout({ id = crypto.randomUUID(), name, page, modules, metadata }) {
  const now = new Date();
  return {
    id,
    name,
    slug: LAYOUT_SLUG,
    page,
    status: 'published',
    version: 1,
    config: {
      viewport: 'desktop',
      modules,
      themeOverrides: {
        components: { navStyle: 'floating', buttonShape: 'pill' },
        imagery: { heroBackground: 'gradient:indigo-cyan' },
      },
    },
    allowedRoles: [],
    metadata: { seedKey: SEED_KEY, ...metadata },
    releaseNotes: 'Seeded marketing hero module for admin preview and Storybook baselines.',
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const now = new Date();
      const [existingTheme] = await queryInterface.sequelize.query(
        'SELECT id FROM appearance_themes WHERE slug = :slug LIMIT 1',
        {
          type: QueryTypes.SELECT,
          replacements: { slug: THEME_SLUG },
          transaction,
        },
      );

      const themeId = existingTheme?.id ?? crypto.randomUUID();

      if (existingTheme) {
        await queryInterface.bulkUpdate(
          'appearance_themes',
          {
            name: 'Gigvora Daybreak',
            description: 'Baseline Gigvora gradient theme for marketing and dashboard shells (seed).',
            status: 'active',
            isDefault: true,
            tokens: TOKENS,
            accessibility: ACCESSIBILITY,
            updatedAt: now,
          },
          { id: existingTheme.id },
          { transaction },
        );
      } else {
        await queryInterface.bulkInsert(
          'appearance_themes',
          [
            {
              id: themeId,
              slug: THEME_SLUG,
              name: 'Gigvora Daybreak',
              description: 'Baseline Gigvora gradient theme for marketing and dashboard shells (seed).',
              status: 'active',
              isDefault: true,
              tokens: TOKENS,
              accessibility: ACCESSIBILITY,
              createdBy: null,
              updatedBy: null,
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }

      // ensure the seeded theme is default
      await queryInterface.sequelize.query(
        'UPDATE appearance_themes SET "isDefault" = CASE WHEN id = :themeId THEN true ELSE false END',
        { transaction, replacements: { themeId } },
      );

      const assets = [
        buildAsset({
          label: 'Seed: Daybreak wordmark light',
          type: 'logo_light',
          url: 'https://cdn.gigvora.dev/assets/daybreak/logo-light.svg',
          altText: 'Gigvora daybreak logotype',
          metadata: { width: 320, height: 96 },
          sortOrder: 0,
          isPrimary: true,
        }),
        buildAsset({
          label: 'Seed: Daybreak wordmark dark',
          type: 'logo_dark',
          url: 'https://cdn.gigvora.dev/assets/daybreak/logo-dark.svg',
          altText: 'Gigvora daybreak logotype for dark surfaces',
          metadata: { width: 320, height: 96 },
          sortOrder: 1,
        }),
        buildAsset({
          label: 'Seed: Daybreak marketing hero background',
          type: 'hero',
          url: 'https://cdn.gigvora.dev/assets/daybreak/hero-gradient.png',
          altText: 'Soft gradient hero background used in marketing shells',
          metadata: { width: 1920, height: 1080, focalPoint: { x: 0.45, y: 0.35 } },
          sortOrder: 2,
        }),
      ].map((asset) => ({ ...asset, themeId }));

      for (const asset of assets) {
        await queryInterface.bulkDelete(
          'appearance_assets',
          { label: asset.label },
          { transaction },
        );
      }

      await queryInterface.bulkInsert('appearance_assets', assets, { transaction });

      const layoutModules = [
        {
          id: 'hero',
          type: 'hero',
          title: 'Hire brilliantly. Collaborate beautifully.',
          subtitle: 'The Gigvora platform pairs curated talent with effortless workflows.',
          description:
            'Reusable shell layout that matches the marketing homepage hero and seeds Storybook visual baselines.',
          badge: 'In sync',
          media: 'https://cdn.gigvora.dev/assets/daybreak/hero-gradient.png',
          mediaAlt: 'Gigvora dashboard hero mockup',
          ctaLabel: 'Launch admin appearance manager',
          ctaHref: '/dashboard/admin/appearance',
          columns: 2,
          items: [
            {
              id: 'metric-teams',
              title: '230+',
              description: 'Teams scaling global talent with Gigvora',
              icon: 'sparkles',
            },
            {
              id: 'metric-projects',
              title: '4.7x',
              description: 'Faster go-live for cross-border projects',
              icon: 'rocket',
            },
            {
              id: 'metric-onboarding',
              title: '6 days',
              description: 'Average onboarding time across personas',
              icon: 'clock',
            },
          ],
        },
      ];

      const layout = buildLayout({
        name: 'Gigvora marketing hero',
        page: 'marketing',
        modules: layoutModules,
        metadata: { themeId, author: 'Seed automation' },
      });
      layout.themeId = themeId;

      await queryInterface.bulkDelete(
        'appearance_layouts',
        { slug: LAYOUT_SLUG },
        { transaction },
      );

      await queryInterface.bulkInsert('appearance_layouts', [layout], { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkDelete(
        'appearance_assets',
        { label: ['Seed: Daybreak wordmark light', 'Seed: Daybreak wordmark dark', 'Seed: Daybreak marketing hero background'] },
        { transaction },
      );

      await queryInterface.bulkDelete(
        'appearance_layouts',
        { slug: LAYOUT_SLUG },
        { transaction },
      );

      await queryInterface.bulkDelete(
        'appearance_themes',
        {
          slug: THEME_SLUG,
          description: 'Baseline Gigvora gradient theme for marketing and dashboard shells (seed).',
        },
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
