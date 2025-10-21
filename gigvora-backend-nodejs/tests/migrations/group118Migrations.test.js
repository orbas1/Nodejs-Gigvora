import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { Sequelize as SequelizeLib, DataTypes } from 'sequelize';

import homepageSettingsMigration from '../../database/migrations/20241022100000-admin-homepage-settings.cjs';

const { HOMEPAGE_DEFAULT } = homepageSettingsMigration;

const baseTimestamps = () => ({ createdAt: new Date(), updatedAt: new Date() });

const createPlatformSettingsTable = async (queryInterface) => {
  await queryInterface.createTable('platform_settings', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    key: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    value: { type: DataTypes.JSON, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: SequelizeLib.literal('CURRENT_TIMESTAMP') },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: SequelizeLib.literal('CURRENT_TIMESTAMP') },
  });
};

const fetchPlatformRow = async (sequelize) => {
  const [row] = await sequelize.query("SELECT key, value FROM platform_settings WHERE key = 'platform' LIMIT 1", {
    type: SequelizeLib.QueryTypes.SELECT,
  });
  return row;
};

const parseValue = (value) => {
  if (typeof value === 'string') {
    return JSON.parse(value);
  }
  return value;
};

describe('20241022100000-admin-homepage-settings.cjs', () => {
  let sequelize;
  let queryInterface;

  beforeEach(async () => {
    sequelize = new SequelizeLib('sqlite::memory:', { logging: false });
    queryInterface = sequelize.getQueryInterface();
    await createPlatformSettingsTable(queryInterface);
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it('creates a sanitized homepage configuration when no platform settings exist', async () => {
    await homepageSettingsMigration.up(queryInterface, SequelizeLib);

    const row = await fetchPlatformRow(sequelize);
    expect(row).toBeDefined();

    const parsed = parseValue(row.value);
    expect(parsed.homepage).toBeDefined();
    expect(parsed.homepage.hero.title).toBe(HOMEPAGE_DEFAULT.hero.title);
    expect(parsed.homepage.hero.overlayOpacity).toBeLessThanOrEqual(0.9);
    expect(parsed.homepage.quickLinks).toHaveLength(HOMEPAGE_DEFAULT.quickLinks.length);
    expect(parsed.homepage.valueProps).toHaveLength(HOMEPAGE_DEFAULT.valueProps.length);
  });

  it('sanitizes existing homepage content and preserves safe overrides', async () => {
    await queryInterface.bulkInsert(
      'platform_settings',
      [
        {
          id: 1,
          key: 'platform',
          value: JSON.stringify({
            homepage: {
              announcementBar: {
                enabled: 'true',
                message: '   ',
                ctaLabel: '  ',
                ctaHref: 'javascript:alert(1)',
              },
              hero: {
                title: 'Custom hero title',
                subtitle: '   Trusted teams',
                overlayOpacity: 3,
                backgroundImageUrl: 'javascript:alert(1)',
                backgroundImageAlt: '   ',
                primaryCtaLabel: 'Start now',
                primaryCtaHref: '/onboard',
                secondaryCtaLabel: 'See pricing',
                secondaryCtaHref: 'https://gigvora.com/pricing',
                stats: [
                  { id: 'specialists', label: 'Verified members', value: '12000', suffix: '<script>' },
                  { id: 'regions', label: '', value: 'not-a-number', suffix: '' },
                  { id: 'bad-stat', label: 'Hack', value: '999999', suffix: '%' },
                ],
              },
              valueProps: [
                { id: 'payments', title: 'Payments your CFO loves', description: '', icon: 'CurrencyDollarIcon', ctaHref: 'ftp://bad' },
                { id: 'new-value', title: 'Verified pods', description: 'Pods spin up quickly.', icon: 'SparklesIcon', ctaLabel: 'Discover', ctaHref: '/pods' },
              ],
              featureSections: [
                {
                  id: 'workspace',
                  title: 'Workspace',
                  description: 'Manage everything',
                  mediaType: 'video',
                  mediaUrl: 'https://cdn.gigvora.com/video/workspace.mp4',
                  mediaAlt: 'Workspace overview',
                  bullets: [
                    { id: 'vault', text: '' },
                    { id: 'new-bullet', text: 'Secure storage for assets.' },
                  ],
                },
                {
                  id: 'custom-section',
                  title: 'Playbooks',
                  description: 'Launch faster',
                  mediaType: 'image',
                  mediaUrl: 'https://cdn.gigvora.com/features/playbooks.png',
                  mediaAlt: 'Playbook cards',
                  bullets: [{ id: 'playbook', text: 'Prebuilt compliance workflows.' }],
                },
              ],
              testimonials: [
                { id: 'northwind', quote: '  Gigvora delivered.  ', highlight: 'yes', authorName: 'Leah Patel', authorRole: 'VP', avatarUrl: 'https://cdn.gigvora.com/avatar/northwind.png' },
                { id: 'new-testimonial', quote: 'Incredible experience', authorName: 'Jordan Lee', authorRole: 'Director', avatarUrl: '/avatars/jordan.png', highlight: true },
              ],
              faqs: [
                { id: 'pricing-models', question: 'Pricing?', answer: '' },
                { id: 'security', question: 'Is it secure?', answer: 'Yes, enterprise ready.' },
              ],
              quickLinks: [
                { id: 'demo', label: '', href: 'javascript:void(0)', target: '__proto__' },
                { id: 'docs', label: 'Documentation', href: 'https://docs.gigvora.com', target: '_blank' },
              ],
              seo: {
                title: 'Gigvora <Admin>',
                description: '   ',
                keywords: ['gigvora', '  platform  ', 42],
                ogImageUrl: 'ftp://invalid',
              },
            },
            theme: { color: '#0f0' },
          }),
          ...baseTimestamps(),
        },
      ],
    );

    await homepageSettingsMigration.up(queryInterface, SequelizeLib);

    const row = await fetchPlatformRow(sequelize);
    const parsed = parseValue(row.value);

    expect(parsed.theme.color).toBe('#0f0');

    expect(parsed.homepage.announcementBar.enabled).toBe(true);
    expect(parsed.homepage.announcementBar.message).toBe(HOMEPAGE_DEFAULT.announcementBar.message);
    expect(parsed.homepage.announcementBar.ctaHref).toBe(HOMEPAGE_DEFAULT.announcementBar.ctaHref);

    expect(parsed.homepage.hero.title).toBe('Custom hero title');
    expect(parsed.homepage.hero.overlayOpacity).toBeLessThanOrEqual(0.9);
    expect(parsed.homepage.hero.backgroundImageUrl).toBe(HOMEPAGE_DEFAULT.hero.backgroundImageUrl);
    expect(parsed.homepage.hero.stats.find((item) => item.id === 'specialists')?.value).toBe(12000);
    expect(parsed.homepage.hero.stats.find((item) => item.id === 'specialists')?.suffix).toBe(HOMEPAGE_DEFAULT.hero.stats[0].suffix);
    expect(parsed.homepage.hero.stats.some((item) => item.id === 'bad-stat')).toBe(false);

    expect(parsed.homepage.valueProps.find((item) => item.id === 'payments')?.ctaHref).toBe(HOMEPAGE_DEFAULT.valueProps[1].ctaHref);
    expect(parsed.homepage.valueProps.some((item) => item.id === 'new-value')).toBe(true);

    expect(parsed.homepage.featureSections.find((item) => item.id === 'workspace')?.mediaType).toBe('video');
    expect(parsed.homepage.featureSections.some((item) => item.id === 'custom-section')).toBe(true);
    expect(
      parsed.homepage.featureSections.find((item) => item.id === 'workspace')?.bullets.find((bullet) => bullet.id === 'new-bullet'),
    ).toBeDefined();

    expect(parsed.homepage.testimonials.find((item) => item.id === 'northwind')?.highlight).toBe(true);
    expect(parsed.homepage.testimonials.some((item) => item.id === 'new-testimonial')).toBe(true);

    expect(parsed.homepage.faqs.find((item) => item.id === 'pricing-models')?.answer).toBe(HOMEPAGE_DEFAULT.faqs[1].answer);
    expect(parsed.homepage.faqs.some((item) => item.id === 'security')).toBe(true);

    expect(parsed.homepage.quickLinks.find((item) => item.id === 'demo')?.href).toBe(HOMEPAGE_DEFAULT.quickLinks[0].href);
    expect(parsed.homepage.quickLinks.find((item) => item.id === 'docs')?.href).toBe('https://docs.gigvora.com');

    expect(parsed.homepage.seo.title).toBe('Gigvora <Admin>');
    expect(parsed.homepage.seo.description).toBe(HOMEPAGE_DEFAULT.seo.description);
    expect(parsed.homepage.seo.keywords).toEqual(['gigvora', 'platform']);
    expect(parsed.homepage.seo.ogImageUrl).toBe(HOMEPAGE_DEFAULT.seo.ogImageUrl);
  });

  it('removes homepage configuration on down migration while preserving other keys', async () => {
    await queryInterface.bulkInsert(
      'platform_settings',
      [
        {
          id: 2,
          key: 'platform',
          value: JSON.stringify({ homepage: HOMEPAGE_DEFAULT, theme: { color: '#f00' } }),
          ...baseTimestamps(),
        },
      ],
    );

    await homepageSettingsMigration.down(queryInterface, SequelizeLib);

    const row = await fetchPlatformRow(sequelize);
    const parsed = parseValue(row.value);

    expect(parsed.homepage).toBeUndefined();
    expect(parsed.theme.color).toBe('#f00');
  });
});

