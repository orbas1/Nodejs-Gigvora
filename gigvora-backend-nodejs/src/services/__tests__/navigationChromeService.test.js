import { Sequelize, DataTypes } from 'sequelize';

const testSequelize = new Sequelize('sqlite::memory:', { logging: false });

const NavigationLocale = testSequelize.define(
  'NavigationLocale',
  {
    code: { type: DataTypes.STRING(12), allowNull: false },
    label: { type: DataTypes.STRING(160), allowNull: false },
    nativeLabel: { type: DataTypes.STRING(160), allowNull: false },
    flag: { type: DataTypes.STRING(16), allowNull: true },
    region: { type: DataTypes.STRING(180), allowNull: true },
    coverage: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    status: { type: DataTypes.ENUM('ga', 'beta', 'preview'), allowNull: false, defaultValue: 'preview' },
    supportLead: { type: DataTypes.STRING(180), allowNull: true },
    lastUpdated: { type: DataTypes.DATE, allowNull: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    direction: { type: DataTypes.ENUM('ltr', 'rtl'), allowNull: false, defaultValue: 'ltr' },
    isDefault: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    metadata: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
  },
  { tableName: 'navigation_locales' },
);

NavigationLocale.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id ?? null,
    code: plain.code,
    label: plain.label,
    nativeLabel: plain.nativeLabel,
    flag: plain.flag ?? '',
    region: plain.region ?? '',
    coverage: plain.coverage == null ? null : Number.parseFloat(plain.coverage),
    status: plain.status,
    supportLead: plain.supportLead ?? '',
    lastUpdated: plain.lastUpdated ? new Date(plain.lastUpdated).toISOString() : null,
    summary: plain.summary ?? '',
    direction: plain.direction ?? 'ltr',
    isDefault: Boolean(plain.isDefault),
    metadata: plain.metadata ?? {},
    sortOrder: plain.sortOrder ?? 0,
    createdAt: plain.createdAt ?? null,
    updatedAt: plain.updatedAt ?? null,
  };
};

const NavigationPersona = testSequelize.define(
  'NavigationPersona',
  {
    personaKey: { type: DataTypes.STRING(60), allowNull: false },
    label: { type: DataTypes.STRING(160), allowNull: false },
    icon: { type: DataTypes.STRING(120), allowNull: true },
    tagline: { type: DataTypes.STRING(255), allowNull: true },
    focusAreas: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    metrics: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    primaryCta: { type: DataTypes.STRING(200), allowNull: true },
    defaultRoute: { type: DataTypes.STRING(2048), allowNull: true },
    timelineEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    metadata: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
  },
  { tableName: 'navigation_personas' },
);

NavigationPersona.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id ?? null,
    key: plain.personaKey,
    label: plain.label,
    icon: plain.icon ?? null,
    tagline: plain.tagline ?? '',
    focusAreas: Array.isArray(plain.focusAreas) ? plain.focusAreas : [],
    metrics: Array.isArray(plain.metrics) ? plain.metrics : [],
    primaryCta: plain.primaryCta ?? '',
    defaultRoute: plain.defaultRoute ?? null,
    timelineEnabled: Boolean(plain.timelineEnabled),
    metadata: plain.metadata ?? {},
    sortOrder: plain.sortOrder ?? 0,
    createdAt: plain.createdAt ?? null,
    updatedAt: plain.updatedAt ?? null,
  };
};

const NavigationChromeConfig = testSequelize.define(
  'NavigationChromeConfig',
  {
    configKey: { type: DataTypes.STRING(160), allowNull: false },
    description: { type: DataTypes.STRING(255), allowNull: true },
    payload: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
  },
  { tableName: 'navigation_chrome_configs' },
);

NavigationChromeConfig.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id ?? null,
    key: plain.configKey,
    description: plain.description ?? '',
    payload: plain.payload ?? {},
    createdAt: plain.createdAt ?? null,
    updatedAt: plain.updatedAt ?? null,
  };
};

const serviceModule = await import('../navigationChromeService.js');
serviceModule.__setDependencies({
  models: { NavigationLocale, NavigationPersona, NavigationChromeConfig },
  logger: { child: () => ({ warn: () => {}, info: () => {} }) },
});

const { listNavigationLocales, getNavigationChrome, __resetDependencies } = serviceModule;

describe('navigationChromeService', () => {
  beforeAll(async () => {
    await testSequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await NavigationChromeConfig.destroy({ where: {} });
    await NavigationPersona.destroy({ where: {} });
    await NavigationLocale.destroy({ where: {} });
  });

  afterAll(async () => {
    await testSequelize.close();
    __resetDependencies();
  });

  test('lists locales ordered by sortOrder with metadata', async () => {
    await NavigationLocale.bulkCreate([
      {
        code: 'es',
        label: 'Spanish',
        nativeLabel: 'Español',
        flag: '🇪🇸',
        region: 'Spain • LATAM',
        coverage: 94,
        status: 'ga',
        supportLead: 'Madrid localisation pod',
        lastUpdated: new Date('2024-04-29T10:15:00Z'),
        summary: 'Marketplace and wallet copy translated.',
        sortOrder: 2,
        metadata: { requestPath: '/support/localization/spanish' },
      },
      {
        code: 'ar',
        label: 'Arabic',
        nativeLabel: 'العربية',
        flag: '🇦🇪',
        region: 'MENA',
        coverage: 74,
        status: 'preview',
        supportLead: 'Dubai localisation studio',
        lastUpdated: new Date('2024-03-05T15:10:00Z'),
        summary: 'RTL layout and navigation localised.',
        direction: 'rtl',
        sortOrder: 1,
      },
      {
        code: 'en',
        label: 'English',
        nativeLabel: 'English',
        flag: '🇬🇧',
        region: 'Global',
        coverage: 100,
        status: 'ga',
        supportLead: 'London localisation studio',
        lastUpdated: new Date('2024-05-12T09:00:00Z'),
        summary: 'Editorial canon reviewed quarterly.',
        sortOrder: 0,
        isDefault: true,
      },
    ]);

    const locales = await listNavigationLocales();

    expect(locales).toHaveLength(3);
    expect(locales[0]).toMatchObject({ code: 'en', isDefault: true, flag: '🇬🇧' });
    expect(locales[1]).toMatchObject({ code: 'ar', direction: 'rtl' });
    expect(locales[2].coverage).toBeCloseTo(94);
    expect(locales[2].metadata).toMatchObject({ requestPath: '/support/localization/spanish' });
  });

  test('returns personas and footer payload via getNavigationChrome', async () => {
    await NavigationLocale.create({
      code: 'en',
      label: 'English',
      nativeLabel: 'English',
      flag: '🇬🇧',
      status: 'ga',
      coverage: 100,
      sortOrder: 0,
      isDefault: true,
    });

    await NavigationPersona.create({
      personaKey: 'freelancer',
      label: 'Freelancer studio',
      icon: 'sparkles',
      tagline: 'Manage briefs and billing.',
      focusAreas: ['Portfolio'],
      metrics: [{ label: 'Opportunities', value: 'Curated' }],
      primaryCta: 'Open freelancer studio',
      defaultRoute: '/dashboard/freelancer',
      timelineEnabled: true,
      sortOrder: 0,
      metadata: { journey: 'freelancer' },
    });

    await NavigationChromeConfig.bulkCreate([
      {
        configKey: 'footer_navigation_sections',
        payload: [{ title: 'Platform', links: [{ label: 'Launchpad', to: '/launchpad' }] }],
      },
      {
        configKey: 'footer_status_highlights',
        payload: [{ id: 'uptime', label: 'Platform', status: 'Operational', icon: 'signal' }],
      },
    ]);

    const chrome = await getNavigationChrome();

    expect(chrome.locales).toHaveLength(1);
    expect(chrome.personas[0]).toMatchObject({ key: 'freelancer', primaryCta: 'Open freelancer studio' });
    expect(chrome.footer.navigationSections[0].links[0].to).toBe('/launchpad');
    expect(chrome.footer.statusHighlights[0].id).toBe('uptime');
    expect(chrome.metadata.defaultLocale).toBe('en');
    expect(chrome.metadata.localeStatusCounts.ga).toBe(1);
    expect(chrome.metadata.timelineEnabledPersonaCount).toBe(1);
    expect(chrome.metadata.rtlLocales).toEqual([]);
    expect(chrome.metadata.personaJourneys).toContain('freelancer');
  });
});
